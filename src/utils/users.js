const users = []

// addUser, removeUser, getUser, getUserInRoom

const addUser = ({ id, username, room }) => {
    // clean the data
    try {
        username = username.trim().toLowerCase()
        room = room.trim().toLowerCase()
    } catch (e) {
        username = null
        room = null
    }

    // validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required'
        }
    }

    // username must be unique
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // validate username
    if (existingUser) {
        return {
            error: 'Username is used'
        }
    }

    // store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        // splice() remove element from array with its index
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}


