import OpenAI from 'openai';
import { env } from '../config/env.js';
import { executeTool } from '../tools/index.js';

const toolDefinitions = [
  { type:'function', function:{ name:'getDate', description:'Get the current server date.', parameters:{type:'object',properties:{},additionalProperties:false} } },
  { type:'function', function:{ name:'getTime', description:'Get the current server date and time in ISO format.', parameters:{type:'object',properties:{},additionalProperties:false} } },
  { type:'function', function:{ name:'searchMemory', description:'Search the authenticated user memory before answering questions about saved preferences, projects, people, goals or prior context.', parameters:{type:'object',properties:{search:{type:'string'}},required:['search'],additionalProperties:false} } },
  { type:'function', function:{ name:'createNote', description:'Create a note only when the user explicitly asks to save or create a note.', parameters:{type:'object',properties:{title:{type:'string'},content:{type:'string'},tags:{type:'array',items:{type:'string'}},priority:{type:'string',enum:['low','normal','high','critical']}},required:['title','content'],additionalProperties:false} } },
  { type:'function', function:{ name:'createTask', description:'Create a task only when the user explicitly requests it. Use ISO 8601 for dueAt when a precise date is available.', parameters:{type:'object',properties:{title:{type:'string'},description:{type:'string'},dueAt:{type:['string','null']},priority:{type:'string',enum:['low','normal','high','critical']}},required:['title'],additionalProperties:false} } },
  { type:'function', function:{ name:'deviceStatus', description:'Check whether one of the user devices is available.', parameters:{type:'object',properties:{deviceId:{type:'string'}},required:['deviceId'],additionalProperties:false} } }
];

async function openAIReply({messages,context}){
  if(!env.openaiApiKey) throw Object.assign(new Error('OpenAI is not configured'),{status:503});
  const client=new OpenAI({apiKey:env.openaiApiKey});
  const base=[
    {role:'system',content:'You are NullSpace AI. Be accurate, concise and transparent. Use tools only when needed. Never claim an external action succeeded unless a tool result confirms it. Do not invent memories or device actions.'},
    ...messages.map(m=>({role:m.role,content:m.content}))
  ];
  let totalPrompt=0,totalCompletion=0;
  for(let round=0;round<3;round++){
    const response=await client.chat.completions.create({model:env.openaiModel,messages:base,tools:toolDefinitions,tool_choice:'auto',max_tokens:900});
    totalPrompt+=response.usage?.prompt_tokens||0; totalCompletion+=response.usage?.completion_tokens||0;
    const choice=response.choices?.[0]?.message;
    if(!choice) throw Object.assign(new Error('AI provider returned no message'),{status:502});
    base.push(choice);
    if(!choice.tool_calls?.length) return {text:choice.content||'No response generated',usage:{input_tokens:totalPrompt,output_tokens:totalCompletion}};
    for(const call of choice.tool_calls){
      let args={}; try{args=JSON.parse(call.function.arguments||'{}');}catch{args={};}
      let result;
      try{result=await executeTool(call.function.name,args,context);}catch(e){result={success:false,error:e.message};}
      base.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(result)});
    }
  }
  throw Object.assign(new Error('AI tool loop exceeded the safe limit'),{status:502});
}

async function ollamaReply({messages}){
  if(!env.ollamaBaseUrl) throw Object.assign(new Error('Remote Ollama is not configured'),{status:503});
  const r=await fetch(`${env.ollamaBaseUrl}/api/chat`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:env.ollamaModel,messages,stream:false})});
  if(!r.ok) throw Object.assign(new Error(`Ollama error ${r.status}`),{status:502});
  const data=await r.json();
  return {text:data.message?.content||'No response generated',usage:{}};
}

export async function generateReply(payload){
  if(env.aiProvider==='ollama') return ollamaReply(payload);
  return openAIReply(payload);
}
