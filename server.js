const express = require("express");
const bodyParser=require("body-parser");
const axios=require("axios")
const cors=require("cors");
const sqlite3=require("sqlite3").verbose()
let sql;

const app = express();

app.use(cors());

const db=new sqlite3.Database("./test.db",sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.log(err.message)
})


//created a table named products
// sql=`CREATE TABLE products(id INTEGER PRIMARY KEY,title,price,description,category,image,sold,dateOfSale DATE)`
// db.run(sql);

//drop table
//db.run("DROP TABLE products")

//Insert data into table
async function getData(url){
    try {
        const {data}=await axios.get(url)
        data.map((eachItem)=>{
            let objectData={
                title:eachItem.title,
                price:eachItem.price,
                description:eachItem.description,
                category:eachItem.category,
                image:eachItem.image,
                sold:eachItem.sold,
                dateOfSale:eachItem.dateOfSale.split("T")[0]
            }
            sql=`INSERT INTO products(title,price,description,category,image,sold,dateOfSale) VALUES (?,?,?,?,?,?,?)`
            db.run(sql,[objectData.title,objectData.price,objectData.description,objectData.category,objectData.image,objectData.sold,objectData.dateOfSale],(err)=>{
                if(err) console.error(err);
            })
        })
    } catch (error) {
        console.log(error)
    }
}
//getData("https://s3.amazonaws.com/roxiler.com/product_transaction.json")


// db.all(sql,[],(err,rows)=>{
//     if(err) return console.error(err);
//     rows.forEach(row=>{
//         //console.log(row)
//     })
// })


app.get("/",(req,res)=>{
    const limit=req.query.limit
    const offset=req.query.offset
    const selectedMonth = req.query.month;
    const searchq=req.query.searchq
    const month=parseInt(selectedMonth)<10?`0${selectedMonth}`:`${selectedMonth}`
    console.log(month)
    sql=`SELECT * FROM products WHERE strftime('%m',dateOfSale) = ? AND title LIKE "%${searchq}%" LIMIT ${limit} OFFSET ${offset}`
    db.all(sql,[month],(err,rows)=>{
        if(err) return console.error(err);
        const items=rows.map(row=>{
            //console.log(row)
            return row
            
        })
        res.send(items)
    })
    
})

app.get("/statistics",(req,res)=>{
  const selectedMonth = req.query.month;
  const month=parseInt(selectedMonth)<10?`0${selectedMonth}`:`${selectedMonth}`
    sql=`SELECT SUM(price),COUNT(sold),count(sold=0) FROM products WHERE strftime('%m',dateOfSale) = ?`;
    db.get(sql,[`${month}`],(err,rows)=>{
        if(err) return console.error(err);
        // const items=rows.map(row=>{
        //     //console.log(row)
        //     return row
            
        // })
        res.send(rows)
    })
    console.log(month)

})

app.get('/bar-chart', (req, res) => {
    const selectedMonth = req.query.month;
    const month=parseInt(selectedMonth)<10?`0${selectedMonth}`:`${selectedMonth}`
  
    if (!selectedMonth) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }
  
    // SQL query to get data for the selected month
    sql = `SELECT * FROM products WHERE strftime('%m',dateOfSale) = ?`;
  
    db.all(sql, [month], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
  
      // Initialize price ranges and count dictionary
      const priceRanges = [{name:"0-100",no_of_items:0},{name:"101-200",no_of_items:0},{name:"201-300",no_of_items:0},{name:"301-400",no_of_items:0},{name:"401-500",no_of_items:0},{name:"501-600",no_of_items:0},{name:"601-700",no_of_items:0},{name:"701-800",no_of_items:0},{name:"801-900",no_of_items:0},{name:"901-above",no_of_items:0}];
  
      // Count items in each price range
      rows.forEach((item) => {
        const price = item.price;
        if (price <= 100) {
          priceRanges.map((eachItem)=>eachItem.name==="0-100"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 200) {
          priceRanges.map((eachItem)=>eachItem.name==="101-200"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 300) {
          priceRanges.map((eachItem)=>eachItem.name==="201-300"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 400) {
          priceRanges.map((eachItem)=>eachItem.name==="301-400"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 500) {
          priceRanges.map((eachItem)=>eachItem.name==="401-500"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 600) {
          priceRanges.map((eachItem)=>eachItem.name==="501-600"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 700) {
          priceRanges.map((eachItem)=>eachItem.name==="601-700"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 800) {
          priceRanges.map((eachItem)=>eachItem.name==="701-800"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else if (price <= 900) {
          priceRanges.map((eachItem)=>eachItem.name==="801-900"?eachItem.no_of_items+=1:eachItem.no_of_items)
        } else {
          priceRanges.map((eachItem)=>eachItem.name==="901-above"?eachItem.no_of_items+=1:eachItem.no_of_items)
        }
      });
  
      // Return the response in the desired format
      const responseData = { month: selectedMonth, data: priceRanges }
      res.json(responseData);
    });
  });

  app.get("/pie-chart",(req,res)=>{
    const selectedMonth=req.query.month
    const month=parseInt(selectedMonth)<10?`0${selectedMonth}`:`${selectedMonth}`
    if (!selectedMonth) {
        return res.status(400).json({ error: 'Month parameter is required' });
    }
    sql=`SELECT category,COUNT(*) AS no_of_items FROM products WHERE strftime('%m',dateOfSale) = ? GROUP BY category`
    db.all(sql,[month],(err,rows)=>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(rows)
    })
    

  })



app.listen(process.env.PORT || 8081,()=>{
    console.log("Listening")
})
