function index(req, res) {
    res.send("this is the index route!")
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