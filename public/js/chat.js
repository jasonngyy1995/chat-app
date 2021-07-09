const socket = io()

// Elements
const $messageForm = document.querySelector('#msg_form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocationButton = document.querySelector('#share_location')
const $messages = document.querySelector('#messages')

// Templates
// innerHTML to change the content of <p>
const messageTemplate = document.querySelector('#message_template').innerHTML
const locationTemplate = document.querySelector('#location_template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
// Qs -> query string
// { ignoreQueryPrefix: true } -> make sure the question mark gets away
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // grab the new message
    const $newMessage = $messages.lastElementChild

    // Height of the new message 
    // getComputedStyle() gets all the actual (computed) CSS property and values of the specified element
    const newMessageStyles = getComputedStyle($newMessage)
    // returns the bottom margin of an element
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)

    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    // returns the viewable height of an element in pixels, including padding, border and scrollbar, but not the margin.
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    // returns the entire height of an element in pixels, including padding, but not the border, scrollbar or margin
    const containerHeight = $messages.scrollHeight

    // how far have the user scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        // always scroll to the buttom
        $messages.scrollTop = $messages.scrollHeight
    }
}

// emit message event to server
socket.on('message', (message) => {
    console.log(message)
    // store the final html element to render
    const html = Mustache.render(messageTemplate, {
        username: message.username,

        // render {{message}}
        message: message.text,
        createdAt: moment(message.createdAt).calendar()
    })
    // insert the new message at the buttom
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage)

    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        locationMessage: locationMessage.coords,
        createdAt: moment(locationMessage.createdAt).calendar()
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomList', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// addEventListener -> sets up a function that will be called whenever the specified event is delivered to the target
$messageForm.addEventListener('submit', (e) => {
    // disable
    e.preventDefault()

    // set attribute on HTML element
    // disable the button (unable to send another msg if disabled)
    $messageFormButton.setAttribute('disabled', 'disabled')

    // target -> event listening
    const message = e.target.elements.msg.value

    // (error_msg) -> callback
    socket.emit('sendMessage', message, (error_msg) => {
        // re-enable the button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        // gives focus to a html element, sets the element as the active element 
        $messageFormInput.focus()

        if (error_msg) {
            return console.log(error_msg)
        }

        console.log('Message sent')
    })
})

$shareLocationButton.addEventListener('click', () => {
    // disable
    $shareLocationButton.setAttribute('disabled', 'disabled')
    
    // check location
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported')
    }

    // getCurrentPosition doesn't support async and callback
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (ack_message) => {
            $shareLocationButton.removeAttribute('disabled')
            console.log(ack_message)
        })
    })
})

// handle error in client side
socket.emit('join_chat', { username, room }, (error) => {
    if (error) {
        // show error info in alert
        alert(error)
        // redirect user to homepage
        // '/' -> root of site
        location.href = '/'
    }
}) 