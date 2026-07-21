const express=require('express');
const knex=require('../src/db/connection');
const {authenticate}=require('../src/middleware/auth');
const {createWorkflow}=require('./workflowCore');
const {createGovernedRouter}=require('./routerFactory');
function bindings(sql,params=[]){const values=[];const text=sql.replace(/\$(\d+)/g,(_match,index)=>{values.push(params[Number(index)-1]);return '?';});return{text,values};}
async function queryWith(client,sql,params){const bound=bindings(sql,params);const result=await client.raw(bound.text,bound.values);return result.rows||result;}
const db={query:(sql,params)=>queryWith(knex,sql,params),transaction:(work)=>knex.transaction((trx)=>work((sql,params)=>queryWith(trx,sql,params)))};
module.exports=createGovernedRouter({express,workflow:createWorkflow(require('./config')),auth:authenticate,db});
