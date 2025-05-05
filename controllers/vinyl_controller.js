const connection = require('../data/data.js')

function index(req, res) {
    const sql = `SELECT * FROM vinyls`
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err })
        //console.log(results)
        else res.json(results)
        console.log("index route used!")
    })
}
function show(req, res) {
    res.send("this is the show route!")
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
    store,
    update,
    modify,
    destroy
}