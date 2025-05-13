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

function filter_vinyls(req, res) {
    const { filter, search } = req.query;
    let sql = `
        SELECT
            vinyls.id as productId,
            vinyls.slug,
            vinyls.title,
            vinyls.imgUrl AS vinylImg,
            genres.genreName,
            formats.formatName,
            DATE_FORMAT(vinyls.releaseDate, '%d-%m-%Y') AS releaseDate,
            vinyls.price,
            vinyls.nAvailable,
            authors.name AS authorName
        FROM vinyls
        LEFT JOIN genres ON genres.id = vinyls.genreId
        LEFT JOIN formats ON formats.id = vinyls.formatId
        LEFT JOIN authors ON authors.id = vinyls.authorId
    `;

    let params = [];

    if (filter === "genre") {
        sql += " WHERE genres.genreName LIKE ?";
        params.push('%' + search + '%');
    } else if (filter === "author") {
        sql += " WHERE authors.name LIKE ?";
        params.push('%' + search + '%');
    } else if (filter === "title") {
        sql += " WHERE vinyls.title LIKE ?";
        params.push('%' + search + '%');
    } else if (filter === "all") {
        sql += " WHERE vinyls.title LIKE ? OR authors.name LIKE ? OR genres.genreName LIKE ?";
        params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    }

    sql += " GROUP BY vinyls.slug, vinyls.title, vinyls.imgUrl, genres.genreName, formats.formatName, vinyls.releaseDate, vinyls.price, authors.name";

    if (filter === "all") {
        sql = `
            SELECT 
                vinyls.id as productId,
                vinyls.slug,
                vinyls.title,
                vinyls.imgUrl AS vinylImg,
                genres.genreName,
                formats.formatName,
                DATE_FORMAT(vinyls.releaseDate, '%d-%m-%Y') AS releaseDate,
                vinyls.price,
                vinyls.nAvailable,
                authors.name AS authorName,
                (
                    CASE 
                        WHEN vinyls.title LIKE ? THEN 10
                        WHEN vinyls.title LIKE ? THEN 3
                        WHEN vinyls.title LIKE ? THEN 1
                        ELSE 0 
                    END 
                    +
                    CASE 
                        WHEN authors.name LIKE ? THEN 2
                        ELSE 0 
                    END
                    +
                    CASE 
                        WHEN genres.genreName LIKE ? THEN 1
                        ELSE 0 
                    END
                ) AS score
            FROM vinyls
            LEFT JOIN genres ON genres.id = vinyls.genreId
            LEFT JOIN formats ON formats.id = vinyls.formatId
            LEFT JOIN authors ON authors.id = vinyls.authorId
            WHERE vinyls.title LIKE ? OR authors.name LIKE ? OR genres.genreName LIKE ?
            GROUP BY vinyls.slug, vinyls.title, vinyls.imgUrl, genres.genreName, formats.formatName, vinyls.releaseDate, vinyls.price, authors.name
            HAVING score > 0
            ORDER BY score DESC
        `;

        params = [
            search + '%', // For title (exact match)
            '%' + search + '%', // For title
            '%' + search + '%', // For title
            '%' + search + '%', // For author
            '%' + search + '%', // For genre
            '%' + search + '%', // For title
            '%' + search + '%', // For author
            '%' + search + '%'  // For genre
        ];
    }

    connection.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
}


//recent route
function recent(req, res) {
    const sql = `
        SELECT 
            vinyls.id as productId,
            vinyls.slug,
            vinyls.title,
            vinyls.imgUrl AS vinylImg,
            genres.genreName,
            formats.formatName,
            DATE_FORMAT(vinyls.releaseDate, '%d-%m-%Y') AS releaseDate,
            vinyls.price,
            vinyls.nAvailable,
            authors.name AS authorName
        FROM vinyls
        LEFT JOIN genres ON genres.id = vinyls.genreId
        LEFT JOIN formats ON formats.id = vinyls.formatId
        LEFT JOIN authors ON authors.id = vinyls.authorId
        WHERE vinyls.releaseDate <= CURRENT_DATE()
        ORDER BY vinyls.releaseDate DESC
        LIMIT 15;
    `;

    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
        console.log("recent route used!");
    });
}


//filter by genre route
function by_genre(req, res) {
    const genre = req.body.genre;

    const sql = `
        SELECT 
            vinyls.id as productId,
            vinyls.slug,
            vinyls.title,
            vinyls.imgUrl AS vinylImg,
            genres.genreName,
            formats.formatName,
            DATE_FORMAT(vinyls.releaseDate, '%d-%m-%Y') AS releaseDate,
            vinyls.price,
            vinyls.nAvailable,
            authors.name AS authorName
        FROM vinyls
        LEFT JOIN genres ON genres.id = vinyls.genreId
        LEFT JOIN formats ON formats.id = vinyls.formatId
        LEFT JOIN authors ON authors.id = vinyls.authorId
        WHERE genres.genreName = ?
        ORDER BY vinyls.releaseDate DESC
        LIMIT 15;
    `;

    connection.query(sql, [genre], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
        console.log("by_genre route used!");
    });
}

function by_format(req, res) {
    const format = req.body.format;

    const sql = `
        SELECT 
            vinyls.id as productId,
            vinyls.slug,
            vinyls.title,
            vinyls.imgUrl AS vinylImg,
            genres.genreName,
            formats.formatName,
            DATE_FORMAT(vinyls.releaseDate, '%d-%m-%Y') AS releaseDate,
            vinyls.price,
            vinyls.nAvailable,
            authors.name AS authorName
        FROM vinyls
        LEFT JOIN genres ON genres.id = vinyls.genreId
        LEFT JOIN formats ON formats.id = vinyls.formatId
        LEFT JOIN authors ON authors.id = vinyls.authorId
        WHERE formats.formatName = ?
        ORDER BY vinyls.releaseDate DESC
        LIMIT 15;
    `;

    connection.query(sql, [format], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
        console.log("by_format route used!");
    });
}

function update_quantity(req, res) {
    console.log("update_quantity route used!");

    const updates = req.body.updates;
    //console.log(updates)

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty updates array' });
    }

    const failed = [];
    let completed = 0;

    updates.forEach(({ slug, nAvailable }) => {
        const sql = `
            UPDATE vinyls
            SET nAvailable = ?
            WHERE slug = ?;
        `;

        connection.query(sql, [nAvailable, slug], (err, results) => {
            if (err) {
                failed.push({ slug, error: 'Database error' });
            } else if (results.affectedRows === 0) {
                failed.push({ slug, error: 'Vinyl not found' });
            }
            checkCompletion();
        });
    });

    function checkCompletion() {
        completed++;
        if (completed === updates.length) {
            if (failed.length > 0) {
                console.log(failed)
                return res.status(207).json({
                    message: 'Some updates failed',
                    failed,
                });
            } else {
                return res.json({ message: 'All vinyls updated successfully' });
            }
        }
    }
}

// function store(req, res) {
//     res.send("this is the store route!")
// }
// function update(req, res) {
//     res.send("this is the update route!")
// }
// function modify(req, res) {
//     res.send("this is the modify route!")
// }
// function destroy(req, res) {
//     res.send("this is the destroy route!")
// }

module.exports = {
    index,
    show,
    recent,
    by_genre,
    by_format,
    filter_vinyls,
    update_quantity,
    //store,
    //update,
    //modify,
    //destroy
}