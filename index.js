const express = require('express');
const path =require('path');
const {open}=require('sqlite');
const sqlite3=require('sqlite3');
const uuid = require('uuid');
const app = express();
app.use(express.json());


//database connection 
const dbpath=path.join(__dirname,"./details.db"); //details.db has player table init
let db;
const initailizeDBAndSever=async()=>{
    try{ 
        db = await open({
            filename:dbpath,
            driver:sqlite3.Database
        });
        console.log('DB Connected')
    }catch(e){
        console.log("DB error");
        process.exit(1)
    }
};
initailizeDBAndSever();


const port=4003;



//post api to add player details//

app.post('/add',async (request,response)=>{
   
    try{
        const playerDetails=request.body;    //fetching player details from user input from request body
        const {name,score}=playerDetails;
        const id = uuid.v4()
        
        //adding  user input details into players table
        const addPlayerDetails=`INSERT INTO players(id,name,score) VALUES('${id}','${name}',${score});`; //inserting player details in players table
        const dbResponse=await db.run(addPlayerDetails)
        const addCount = dbResponse.lastID

        const updateQuery = `UPDATE count SET add_count = ${addCount}`;  //updating count of add api in count table 
        const updateRes = await db.run(updateQuery);
        response.status(200).json({message:'user created successfully'});

    }catch(err){
        response.status(400).json({message:err.message})
    }
   
}); 

 //count api 

app.get('/count_data',async(request,response)=>{
    try {
        const resData = await db.get('select * from count') //fetching total count of update api and add api count from count table
        response.status(200).json(resData)
        
    } catch (error) {
        response.status(400).json({message:error.message})
    }
});



//update api //

app.patch("/update/:id",async(request,response)=>{
   try {
            const {id}=request.params;
            const playerDetails=request.body;
            const {name,score}=playerDetails;
        //updating the player details in player table using user input
            const updatePlayerDetails=`
            UPDATE players
            SET 
            name='${name}',
            score=${score}
            WHERE id='${id}'; `;
            const updateresponse=await db.run(updatePlayerDetails);
            if(updateresponse.changes===1){
                response.send(200).json({message:"Details updated successfully"})
                try {
                    const getRes = await db.get('SELECT update_count FROM count')   //fetching update api count from count table
                    const count = getRes.update_count+1
                    console.log(getRes.update_count)
                    const updateCountRes = await db.run(`update count set update_count = ${count};`) //updating count table with update api count
                    
                    } catch (error) {
                            response.status(400).json({message:error.message})
                        }
            }else{
                response.status(400).json({message:"Error while updating"})
            }
            
        } catch (error) {
       response.status(400).json({message:error.message})
   }
});

//server port

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
