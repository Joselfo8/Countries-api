const { Router } = require('express');
const axios = require('axios')

const { Op, Country, TouristActivity } = require('../db.js');

const router = Router();

const getCountries = async () => {
    try {
        const response = await axios.get(`https://restcountries.com/v3/all`)
        const map = await response.data.map(a => {
            return {
                id: a.cca3,
                name: a.name.official,
                flag: a.flags[1],
                continent: a.continents[0],
                capital: a.capital != null ? a.capital[0] : "No data", //
                subregion: a.subregion != null ? a.subregion : "No data",
                area: a.area,
                population: a.population,
            }
        })
        return map
    } catch (error) {
        console.log(error)
    }
}

const countriesToDb = async () => {
    try {
        const countries = await Country.findAll();
        if(countries && countries.length === 0) {
            const array = await getCountries();
            await Country.bulkCreate(array)
        }
    } catch (error) {
        console.log(error)
    }
}

const loadCountries = async () => { await countriesToDb() }
loadCountries()

router.get('/countries', async (req, res) => {
    const { name } = req.query;

    try {
        if(!name) {
            const countries = await Country.findAll({
                include: [{ // eagerloading de TouristActivity
                    model: TouristActivity,
                    attributes: [ 'name', 'difficulty', 'duration', 'season',],
                    through: { attributes: [] }
                }] 
            });
            
            if(countries.length) {
                return res.status(200).json(countries);
            } else {
                return res.status(404).send("Countries not found!");
            }
        } else {
            const country = await Country.findAll({
                where: {
                    name: {[Op.substring]: name}
                }, 
                include: [{ 
                    model: TouristActivity,
                    attributes: [ 'name', 'difficulty', 'duration', 'season',],
                    through: { attributes: [] }
                }] 
            })
            if(country.length) {
                return res.status(200).json(country);
            } else {
                return res.status(404).send("Country not found!");
            }
        }    
    } catch (error) {
        console.log(error)
    }
});

router.get('/countries/:idPais', async (req, res) => {
    const { idPais } = req.params;
    
    try {
        const country = await Country.findOne({
            where: {
                id:  idPais.toUpperCase()
            }, 
            include: [{ 
                model: TouristActivity,
                attributes: [ 'name', 'difficulty', 'duration', 'season',],
                through: { attributes: [] }
            }] 
        })
        if(country) {
            return res.status(200).json(country);
        } else {
            return res.status(404).send("Country not found!");
        } 
    } catch (error) {
        console.log(error)
    }
    
});


module.exports = router;