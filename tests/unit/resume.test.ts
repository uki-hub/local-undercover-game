import { expect, it } from 'vitest'
import raw from '../../public/words/id.json'
import { packSchema } from '../../src/content/words'
import { start, choices, transition, awardIds, type Command } from '../../src/engine/game'
import { actorId, assigned, defaults, matchSchema, type Person } from '../../src/engine/model'
import { localeFor } from '../../src/i18n'
import { coherent } from '../../src/store/session'
const pack=packSchema.parse(raw)
const people:Person[]=Array.from({length:20},(_,i)=>({name:'Nama '+i,id:'u'+i,avatar:'owl'}))
function seeded(seed:number){
  return (n:number)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n)}
}
it.each(Array.from({length:18},(_,i)=>i+3))('roster size %i finishes legally across repeatable random games and reloads',(n)=>{
  for(let seed=1;seed<=4;seed++){
    const rng=seeded(37*n+seed)
    let m=start(people.slice(0,n),{...defaults,white:n>=7,fool:n>=6,couple:n>=5,
      revenger:true,justice:n>=4,mime:true,undercover:Math.max(1,Math.floor(n/5))},pack,[],[],rng)
    let steps=0
    while(!m.winner){
      expect(++steps).toBeLessThan(2000)
      expect(coherent(m)).toBe(true)
      const options=choices(m)
      let cmd:Command={type:'next'}
      if(options.length)cmd={type:'choose',actor:actorId(m),value:options[rng(options.length)]}
      if(m.phase==='guess')cmd={type:'choose',actor:actorId(m),value:seed%2?'uji':assigned(m,{role:'civilian'})!}
      if(steps%13===0)m=matchSchema.parse(JSON.parse(JSON.stringify(m)))
      const rev=m.revision
      m=transition(m,rev,cmd,rng)
      expect(m.revision).toBe(rev+1)
      expect(transition(m,rev,cmd,rng)).toBe(m)
    }
    expect(coherent(m)).toBe(true)
    expect(new Set(awardIds(m)).size).toBe(awardIds(m).length)
  }
})
it('rejects damaged saved progress and unknown schema versions',()=>{
  const m=start(people,defaults,pack,[],[],()=>0)
  expect(coherent({...m,cursor:20})).toBe(false)
  expect(coherent({...m,phase:'wheel',candidates:['extra','eliminate'],outcome:'invalid'})).toBe(false)
  expect(coherent({...m,phase:'target',ballot:'target',cursor:2,votes:{}})).toBe(false)
  expect(coherent({...m,queue:[{kind:'partner',id:'missing'}]})).toBe(false)
  expect(matchSchema.safeParse({...m,version:999}).success).toBe(false)
})
it('UI locale fallback leaves word language, curated aliases and pinned words unchanged',()=>{
  const m=start(people,defaults,pack,[],[],()=>0)
  const before=JSON.stringify(m.triple)
  expect(localeFor('en')).toBe('id');expect(localeFor('id')).toBe('id')
  expect(m.locale).toBe('id');expect(JSON.stringify(m.triple)).toBe(before)
  const selected=start(people,defaults,pack,[],[m.triple.id],()=>0)
  expect(selected.triple.id).not.toBe(m.triple.id)
})
