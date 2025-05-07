const connection = require('../data/data.js')


function index(req, res) {
    const sql = `
                SELECT vinyls.id as productId, vinyls.slug, vinyls.title, vinyls.imgUrl as vinylImg, vinyls.genre, vinyls.format, vinyls.releaseDate, vinyls.price, vinyls.nAvailable, authors.name as authorName, authors.imgUrl as authorImg, publishers.name as publisherName
FROM vinyls
LEFT JOIN authors on authors.id = author_id
LEFT JOIN publishers on publishers.id = publisher_id
ORDER BY releaseDate DESC;
                `

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
//recent route
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
//filter by genre route
function by_genre(req, res) {
    const genre = req.body.genre;
    const sql = `
                SELECT *
                FROM vinyls
                WHERE genre = ?
                LIMIT 10;`

    connection.query(sql, [genre], (err, results) => {
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
    by_genre,
    store,
    update,
    modify,
    destroy
}