const connection = require('../data/data.js')


function index(req, res) {
    const sql = `
                SELECT vinyls.id as productId, vinyls.slug, vinyls.title, vinyls.imgUrl as vinylImg, genres.genreName, formats.formatName, DATE_FORMAT(vinyls.releaseDate, '%d-%m-%Y') AS releaseDate, vinyls.price, vinyls.nAvailable, authors.name as authorName, authors.imgUrl as authorImg, publishers.name as publisherName
FROM vinyls
LEFT JOIN authors on authors.id = authorId
LEFT JOIN publishers on publishers.id = publisherId
LEFT JOIN genres on genres.id = genreId
LEFT JOIN formats on formats.id = formatId
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
    const sql = `
                SELECT
                vinyls.id AS productId,
                vinyls.slug,
                vinyls.title,
                vinyls.imgUrl AS vinylImg,
                genres.genreName,
                formats.formatName,
                DATE_FORMAT(vinyls.releaseDate, '%d-%m-%Y') AS releaseDate,
                vinyls.price,
                vinyls.nAvailable,
                authors.name AS authorName,
                authors.imgUrl AS authorImg,
                authors.description AS authorDescription,
                publishers.name AS publisherName,
                publishers.description AS publisherDescription,
                COUNT(tracks.id) AS tracksNumber,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'name', tracks.name,
                        'length', tracks.length
                    )
                ) AS tracks
                FROM vinyls
                LEFT JOIN tracks ON tracks.vinylId = vinyls.id
                LEFT JOIN authors ON authors.id = authorId
                LEFT JOIN publishers ON publishers.id = publisherId
                LEFT JOIN genres ON genres.id = genreId
                LEFT JOIN formats ON formats.id = formatId
                WHERE vinyls.slug = ?
                GROUP BY
                    vinyls.id, vinyls.slug, vinyls.title, vinyls.imgUrl, genres.genreName,
                    formats.formatName, vinyls.releaseDate, vinyls.price, vinyls.nAvailable,
                    authors.name, authors.imgUrl, publishers.name
                ORDER BY releaseDate DESC;

                `
    const slug = req.params.slug;

    connection.query(sql, [slug], (err, results) => {
        if (err) return res.status(500).json({ error: err })
        //console.log(results)
        if (results.length === 0) {
            return res.status(404).json({ message: 'Vinyl not found' });
        }

        res.json(results[0])
        console.log("show route used!")
    })
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