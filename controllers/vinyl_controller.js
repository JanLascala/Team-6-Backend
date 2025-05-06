const connection = require('../data/data.js')

//recent route
function index(req, res) {
    res.send("this is the index route!")
}
function show(req, res) {
    res.send("this is the show route!")
}

function recent(req, res) {
    const sql = `
                SELECT *
                FROM vinyls
                WHERE release_Date < CURRENT_DATE()
                ORDER BY release_Date DESC
                LIMIT 10;`

    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err })
        //console.log(results)
        else res.json(results)
        console.log("recent route used!")
    })
}

function by_genre(req, res) {
    //const genre= req.params.
    const sql = `
                SELECT *
                FROM vinyls
                WHERE genre === ?
                LIMIT 10;`

    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err })
        //console.log(results)
        else res.json(results)
        console.log("by_genre route used!")
    })
}


function store(req, res) {
    res.send("this is the store route!")
}
function update(req, res) {
    res.send("this is the update route!")
}
function modify(req, res) {
    res.send("this is the modify route!")
}
function destroy(req, res) {
    res.send("this is the destroy route!")
}

module.exports = {
    index,
    show,
    recent,
    store,
    update,
    modify,
    destroy
}