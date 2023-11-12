const express = require("express");
const bodyParser=require("body-parser");
const axios=require("axios")
const cors=require("cors");
const sqlite3=require("sqlite3").verbose()
let sql;

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

const app = express();

app.use(cors());

app.get("/",(req,res)=>{
    const limit=req.query.limit
    const offset=req.query.offset
    const selectedMonth = req.query.month;
    const month=parseInt(selectedMonth)<10?`0${selectedMonth}`:`${selectedMonth}`
    console.log(month)
    sql=`SELECT * FROM products WHERE strftime('%m',dateOfSale) = ? LIMIT ${limit} OFFSET ${offset}`
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
      const priceRanges = {
        '0-100': 0,
        '101-200': 0,
        '201-300': 0,
        '301-400': 0,
        '401-500': 0,
        '501-600': 0,
        '601-700': 0,
        '701-800': 0,
        '801-900': 0,
        '901-above': 0,
      };
  
      // Count items in each price range
      rows.forEach((item) => {
        const price = item.price;
        if (price <= 100) {
          priceRanges['0-100'] += 1;
        } else if (price <= 200) {
          priceRanges['101-200'] += 1;
        } else if (price <= 300) {
          priceRanges['201-300'] += 1;
        } else if (price <= 400) {
          priceRanges['301-400'] += 1;
        } else if (price <= 500) {
          priceRanges['401-500'] += 1;
        } else if (price <= 600) {
          priceRanges['501-600'] += 1;
        } else if (price <= 700) {
          priceRanges['601-700'] += 1;
        } else if (price <= 800) {
          priceRanges['701-800'] += 1;
        } else if (price <= 900) {
          priceRanges['801-900'] += 1;
        } else {
          priceRanges['901-above'] += 1;
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



app.listen(8081,()=>{
    console.log("Listening")
})