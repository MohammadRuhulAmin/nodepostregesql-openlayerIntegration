const express = require('express');
const app = express();
const pool = require('./connection');
const PORT = 3000;
const url = require('url');
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
    //var geoJson,stArea,stleng,details;
    let query1 = "SELECT ST_AsGeoJson(ST_Simplify(geom,2)) FROM borolekh Where plot_no_en = $1";
    let query2 = "SELECT shape_area FROM borolekh WHERE plot_no_en = $1";
    let query3 = "SELECT shape_leng FROM borolekh WHERE plot_no_en = $1";
    let query4 = "SELECT * FROM borolekh WHERE plot_no_en = $1";
    pool.query(query4,[plot_no_en],(err,result)=>{
        if(err)throw err;
        else{
            var details = result.rows[0];
            pool.query(query3,[plot_no_en],(err,result)=>{
                if(err)throw err;
                else{
                    var stleng= result.rows[0];
                    pool.query(query2,[plot_no_en],(err,result)=>{
                        if(err)throw err;
                        else{ 
                           var  stArea = result.rows[0];
                           pool.query(query1,[plot_no_en],(err,results)=>{
                            if(err)throw err;
                            geoJson = results.rows[0].st_asgeojson; 
                            var sArea = parseFloat(stArea.shape_area)*0.00002295684113;
                            sArea = sArea.toFixed(4);
                            var sLength = parseFloat(stleng.shape_leng)*3.28084 ;
                            
                            
                            
                            if(details.archrive_plot == 'y'){
                                let qry9 = "select plot_no_en from borolekh order by plot_no_en asc";
                                    pool.query(qry9, (err, results) => {
                                        if (err) throw err
                                            else {
                                                var plotList = results.rows;
                                                res.render('index',{plotList:results.rows,Message:"Archrived"});
                                            }
                                        });
                               
                            }
                            else{
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
                                    parent_plot:details.parent_plot
                                   
                                    
                                });
                            }
                          
                        });
                        }
                        
                    });
                }
                
            });
        }
        
    });
   
    

    

    
  
    
});

app.post('/savePlot', (req,res)=>{
    const {spGeoJson_1,spGeoJson_2,plotId,sp_area_1,sp_area_2,sp_arm_1,sp_arm_2} = req.body;  
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
                            let qry3 = "SELECT plot_no_en from borolekh order by plot_no_en desc limit 1";
                            pool.query(qry3,(err,result)=>{
                                if(err) throw err;
                                else {
                                    var lastPlotId = result.rows[0].plot_no_en;
                                    let qry6 = "SELECT ST_Area($1)";
                                    pool.query(qry6,[geom1.st_geomfromgeojson],(err,result)=>{
                                        if(err)throw err;
                                        else{
                                            var geom1Area = result.rows[0];
                                            pool.query(qry6,[geom2.st_geomfromgeojson],(err,result)=>{
                                                if(err)throw err;
                                                else {
                                                    var geom2Area = result.rows[0];
                                                    let qry7 = "SELECT ST_Length( ST_boundary($1))";
                                                    pool.query(qry7,[geom1.st_geomfromgeojson],(err,result)=>{
                                                        if(err) throw err;
                                                        else {
                                                            var geom1Length = result.rows[0];
                                                            pool.query(qry7,[geom2.st_geomfromgeojson],(err,result)=>{
                                                                if(err)throw err;
                                                                else {
                                                                    var geom2Length = result.rows[0];
                                                                    console.log(geom2Length);
                                                                    let qry4 =  "INSERT INTO borolekh(pj_name_en,pj_name_bn,m_code,m_div_en,m_div_bn,m_dist_en,m_dist_bn,m_thana_en,m_thana_bn,m_name_en,m_name_bn,jl_no_en,jl_no_bn,sht_no_en,sht_no_bn,l_code_en,l_code_bn,l_name_en,l_name_bn,plot_no_en,plot_no_bn,sv_type_en,sv_type_bn,scale_en,scale_bn,sv_year_en,sv_year_bn,rev_no_en,rev_no_bn,geocode_en,remarks,filename,shape_leng,shape_area,geom,parent_plot) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36)";
                                                                    pool.query(qry4,[pd.pj_name_en,pd.pj_name_bn,pd.m_code,pd.m_div_en,pd.m_div_bn,pd.m_dist_en,pd.m_dist_bn,pd.m_thana_en,pd.m_thana_bn,pd.m_name_en,pd.m_name_bn,pd.jl_no_en,pd.jl_no_bn,pd.sht_no_en,pd.sht_no_bn,pd.l_code_en,pd.l_code_bn,pd.l_name_en,pd.l_name_bn,lastPlotId+1,lastPlotId+1,pd.sv_type_en,pd.sv_type_bn,pd.scale_en,pd.scale_bn,pd.sv_year_en,pd.sv_year_bn,pd.rev_no_en,pd.rev_no_bn,pd.geocode_en,pd.remarks,pd.filename,geom1Length.st_length,geom1Area.st_area,geom1.st_geomfromgeojson,pd.plot_no_en],(err,result)=>{
                                                                             if(err)throw err;
                                                                             else{
                                                                                
                                                                                let qry5 =  "INSERT INTO borolekh(pj_name_en,pj_name_bn,m_code,m_div_en,m_div_bn,m_dist_en,m_dist_bn,m_thana_en,m_thana_bn,m_name_en,m_name_bn,jl_no_en,jl_no_bn,sht_no_en,sht_no_bn,l_code_en,l_code_bn,l_name_en,l_name_bn,plot_no_en,plot_no_bn,sv_type_en,sv_type_bn,scale_en,scale_bn,sv_year_en,sv_year_bn,rev_no_en,rev_no_bn,geocode_en,remarks,filename,shape_leng,shape_area,geom,parent_plot) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36)";
                                                                                pool.query(qry5,[pd.pj_name_en,pd.pj_name_bn,pd.m_code,pd.m_div_en,pd.m_div_bn,pd.m_dist_en,pd.m_dist_bn,pd.m_thana_en,pd.m_thana_bn,pd.m_name_en,pd.m_name_bn,pd.jl_no_en,pd.jl_no_bn,pd.sht_no_en,pd.sht_no_bn,pd.l_code_en,pd.l_code_bn,pd.l_name_en,pd.l_name_bn,lastPlotId+2,lastPlotId+2,pd.sv_type_en,pd.sv_type_bn,pd.scale_en,pd.scale_bn,pd.sv_year_en,pd.sv_year_bn,pd.rev_no_en,pd.rev_no_bn,pd.geocode_en,pd.remarks,pd.filename,geom1Length.st_length,geom2Area.st_area,geom2.st_geomfromgeojson,pd.plot_no_en],(err,result)=>{
                                                                                    if(err) throw err;
                                                                                    else {
                                                                                        let qry6 = "UPDATE borolekh SET archrive_plot = $1 WHERE plot_no_en = $2";
                                                                                        pool.query(qry6,['y',pd.plot_no_en],(err,result)=>{
                                                                                            if(err) throw err;
                                                                                            else{
                                                                                                let qry9 = "select plot_no_en from borolekh order by plot_no_en asc";
                                                                                                pool.query(qry9, (err, results) => {
                                                                                                    if (err) throw err
                                                                                                    else {
                                                                                                        var plotList = results.rows;
                                                                                                        res.render('index',{plotList:results.rows});
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        })
                                                                                        
                                                                                    }
                                                                                })
                                                                            }  
                                                                    });  
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                           
                                        }
                                    })
                                  
                                }
                            })     
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



app.get('/view-mouza',(req,res)=>{
    let qry = "SELECT ST_AsGeoJSON(geom) FROM borolekh limit 2000";
    pool.query(qry,(err,result)=>{
        if(err)throw err;
        else{
            var result = result.rows;
           
            var mouzaMap = {
                "type" : "MultiPolygon",
                 "coordinates":[[]]

            };
            for(let i = 0;i<result.length;i++){
               mouzaMap.coordinates[0].push(JSON.parse(result[i].st_asgeojson).coordinates[0][0]);
            }
           //var plot =  {"type":"MultiPolygon","coordinates":[[[[4046.137459764,-2878.714050774],[4014.873859615,-2873.018287875],[3971.718316001,-2867.722415084],[3939.301623603,-2865.072573053],[3914.316827077,-2859.209277177],[3846.534808558,-2846.816429934],[3802.442194746,-2836.671482232],[3822.019875457,-2796.044405241],[3848.384732795,-2732.099802185],[3874.151042427,-2676.253161509],[3895.026300793,-2611.971703364],[3918.28929954,-2553.516381049],[3947.169831119,-2486.771113005],[4004.175654468,-2503.78604411],[4064.735942756,-2522.756743693],[4102.229970925,-2537.668629483],[4101.264122211,-2547.624798289],[4102.267962026,-2581.728831568],[4103.472529562,-2621.230148818],[4106.034159702,-2646.297371179],[4107.286034321,-2658.547781159],[4111.296041379,-2695.657545389],[4113.600949346,-2721.897436354],[4115.104193936,-2760.055480338],[4119.452871125,-2838.399779034],[4119.038017056,-2868.697578841],[4061.185116927,-2877.200944262],[4046.137459764,-2878.714050774]]]]};
            //res.send(mouzaMap);
            res.render('mouzaMap',{GeoJSON:JSON.stringify(mouzaMap)});
        }
    })
})

app.get('/experiment-map-label',(req,res)=>{
    res.render('experimentMap');
})


app.get('/test-point',(req,res)=>{
    res.render('Experiment/point');
})

app.listen(PORT,()=>{
    console.log(`PORT is listen on ${PORT}`);
})
