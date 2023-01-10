const express = require('express');
const app = express();
const pool = require('./connection');
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./view")
app.use(express.static(__dirname + "/public"))
const bodyParser = require("body-parser")
  


app.use(bodyParser.urlencoded({
    extended:true
}));


app.get('/',(req,res)=>{
    let qry = "select plot_no_en from borolekh order by plot_no_en asc";
    pool.query(qry, (err, results) => {
        if (err) throw err
        else {
            res.render('index',{plotList:results.rows});
        }
    });
});

app.get('/searchplot',(req,res)=>{
    const plot_no_en = req.query.plotNo;
    var geoJson,stArea,stleng,details;
    let query1 = "SELECT ST_AsGeoJson(ST_Simplify(geom,2)) FROM borolekh Where plot_no_en = $1";
    let query2 = "SELECT shape_area FROM borolekh WHERE plot_no_en = $1";
    let query3 = "SELECT shape_leng FROM borolekh WHERE plot_no_en = $1";
    let query4 = "SELECT * FROM borolekh WHERE plot_no_en = $1";
    pool.query(query4,[plot_no_en],(err,result)=>{
        if(err)throw err;
        details = result.rows[0]
        
    });
   
    pool.query(query3,[plot_no_en],(err,result)=>{
        if(err)throw err;
        stleng= result.rows[0]
        
    });

    pool.query(query2,[plot_no_en],(err,result)=>{
        if(err)throw err;
        stArea = result.rows[0]
        
    });

    pool.query(query1,[plot_no_en],(err,results)=>{
        if(err)throw err;
        geoJson = results.rows[0].st_asgeojson; 
        let sArea = parseFloat(stArea.shape_area)*0.00002295684113;
        sArea = sArea.toFixed(4);
        let sLength = parseFloat(stleng.shape_leng)*3.28084 ;
        
        
        
        res.render('map',
        {
            plotId:plot_no_en,
            plotInfo:geoJson,
            plotArea:stArea.shape_area,
            plotLeng:stleng.shape_leng,
            district :details.m_dist_en,
            subDistrict:details.m_name_en,
            jlNo:details.jl_no_en,
            plotNo:details.plot_no_en,
           
            
        });
    });
  
    
});

app.post('/savePlot', (req,res)=>{
    
    const {spGeoJson_1,spGeoJson_2,plotId} = req.body;  
   
    let qry1 = "SELECT ST_GeomFromGeoJSON($1)";
    pool.query(qry1,[spGeoJson_1],(err,result)=>{
        if(err)throw err;
        else{
            var geom1 = result.rows[0];
            pool.query(qry1,[spGeoJson_2],(err,result)=>{
                if(err)throw err;
                else{
                    var geom2 = result.rows[0];
                    
                    let qry2 = "SELECT * FROM borolekh WHERE plot_no_en = $1";
                    pool.query(qry2,[plotId],(err,result)=>{
                        if(err)throw err;
                        else{
                            var pd = result.rows[0];
                            console.log(geom1,geom2,pd);
                            res.send("ok ")
                        }
                    })
                }
            })
        }
    })
   
    
            
    
      

  
   
})

app.post('/addnew-plot',(req,res)=>{
    const {gid,oid_,name,symbolid,area_h,geom} = req.body;
    
    let qry = "insert into mouza_map_drone(oid_,name,symbolid,area_h,geom) values($1,$2,$3,$4,$5)";
    pool.query(qry, [oid_,name,symbolid,area_h,geom], (err, results) => {
        if(err)throw err; 
        else  res.send("Data inserted Successfully");
    })
})  


app.listen(PORT,()=>{
    console.log(`PORT is listen on ${PORT}`);
})
