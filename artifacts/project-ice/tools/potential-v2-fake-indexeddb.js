/* Test-only minimal transactional IndexedDB emulator for Project Ice.
 * Strictly runs in Node. Simulates atomic commit/abort and request callbacks.
 * This does NOT substitute for WebKit/iPhone IndexedDB acceptance.
 */
'use strict';
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function fakeIndexedDB(options={}){
 const registry=new Map();
 const counters={opens:[],deletions:[],transactions:0,abortions:0};
 function enqueue(fn){queueMicrotask(fn);}
 class Transaction{
   constructor(db,mode){
     this.db=db;this.mode=mode;this.stage=new Map(
       [...db.records.entries()].map(([k,v])=>[k,clone(v)]));
     this.pending=0;this.finished=false;this.aborted=false;
     this.oncomplete=null;this.onabort=null;this.onerror=null;
     counters.transactions++;
   }
   objectStore(name){
     if(name!=='worlds')throw Error('Unknown object store '+name);
     const tx=this;
     const request=fn=>{
       if(tx.aborted||tx.finished)throw Error('TransactionInactiveError');
       tx.pending++;
       const req={result:undefined,error:null,onsuccess:null,onerror:null};
       enqueue(()=>{
         if(tx.aborted||tx.finished)return;
         try{req.result=fn();req.onsuccess?.({target:req});}
         catch(error){
           req.error=error;
           req.onerror?.({target:req});
           tx.abort(error);return;
         }
         tx.pending--;tx.finishWhenIdle();
       });
       return req;
     };
     return{
       get(key){return request(()=>clone(tx.stage.get(key)));},
       put(object){
         if(tx.mode!=='readwrite')throw Error('ReadOnlyError');
         if(!object||!object.id)throw Error('Missing keyPath id');
         const bytes=JSON.stringify(object).length;
         if(bytes>(options.maxRecordBytes??Infinity)){
           const e=Error('Simulated QuotaExceededError');
           e.name='QuotaExceededError';
           throw e;
         }
         return request(()=>{
           tx.stage.set(object.id,clone(object));
           return object.id;
         });
       },
       delete(key){
         if(tx.mode!=='readwrite')throw Error('ReadOnlyError');
         return request(()=>tx.stage.delete(key));
       }
     };
   }
   finishWhenIdle(){
     if(this.pending!==0)return;
     enqueue(()=>{
       if(this.pending||this.aborted||this.finished)return;
       this.finished=true;
       if(this.mode==='readwrite')this.db.records=this.stage;
       this.oncomplete?.();
     });
   }
   abort(error){
     if(this.finished||this.aborted)return;
     this.aborted=true;counters.abortions++;
     this.error=error||null;
     enqueue(()=>this.onabort?.());
   }
 }
 function open(name,version){
   counters.opens.push(name);
   const req={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null};
   enqueue(()=>{
     try{
       let db=registry.get(name),fresh=!db;
       if(!db){
         db={records:new Map(),objectStoreNames:{contains:k=>k==='worlds'},
           createObjectStore:()=>({}),transaction:(store,mode)=>
             new Transaction(db,mode),close:()=>{}};
         registry.set(name,db);
       }
       req.result=db;
       if(fresh)req.onupgradeneeded?.();
       req.onsuccess?.();
     }catch(e){req.error=e;req.onerror?.();}
   });
   return req;
 }
 function deleteDatabase(name){
   counters.deletions.push(name);
   const req={onsuccess:null,onerror:null,onblocked:null,error:null};
   enqueue(()=>{registry.delete(name);req.onsuccess?.();});
   return req;
 }
 return{indexedDB:{open,deleteDatabase},counters,registry,
   addSentinel(name,id,record){
     if(!registry.has(name))registry.set(name,{
       records:new Map(),objectStoreNames:{contains:k=>k==='worlds'},
       createObjectStore:()=>({}),close:()=>{}
     });
     registry.get(name).records.set(id,clone(record));
   }};
}
module.exports={fakeIndexedDB};
