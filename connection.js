const Pool = require('pg').Pool;
const pool = new Pool({
	user:"postgres",
	host:"localhost",
	//database:"dynamic_image_processing",
	database:"shapeFile_database",
	password:"ruhulamin",
	port:5432
});

module.exports = pool;