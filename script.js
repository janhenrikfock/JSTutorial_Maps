'use strict'

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')

class Workout {
  date = new Date()
  id = (Date.now() + '').slice(-10) //Use smth. like uuid in a real project

  constructor(coords, distance, duration) {
    this.coords = coords //[lat, lng]
    this.distance = distance // in km
    this.duration = duration // in min
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration)
    this.cadence = cadence
    this.calcPace()
  }

  calcPace() {
    this.pace = this.duration / this.distance
    // A return here is not strictly necessary, since we call the function in the constructor above. However it is good practice.
    return this.pace
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration)
    this.elevationGain = elevationGain
    this.calcSpeed()
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60)
    // A return here is not strictly necessary, since we call the function in the constructor above. However it is good practice.
    return this.speed
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178)
// const cycling1 = new Cycling([39, -12], 27, 95, 523)
// console.log(run1, cycling1)

/////////////////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
  //Private Classfields:
  #map
  #mapEvent
  constructor() {
    this._getPosition()
    form.addEventListener('submit', this._newWorkout.bind(this)) //newWorkout is called by a eventlistener. Therefore we have to pass in the this object, otherwise the this keyword in the called function points to the eventlistener and not our app class.
    inputType.addEventListener('change', this._toggleElevationField)
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get position')
        }
      )
  }

  _loadMap(position) {
    const { latitude } = position.coords
    const { longitude } = position.coords
    const coords = [latitude, longitude]

    this.#map = L.map('map').setView(coords, 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map)

    //Handling click on map
    this.#map.on('click', this._showForm.bind(this))
  }

  _showForm(mapE) {
    this.#mapEvent = mapE
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
  }

  _newWorkout(e) {
    e.preventDefault()

    // Get data from form

    // Check if data is valid

    // If workout running, create running object

    // If workout cycling, create cycling object

    // Add object to workout array

    // Render workout on map as marker

    //Clear inputfields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ''

    //Display Marker

    const { lat, lng } = this.#mapEvent.latlng
    L.marker([lat, lng], { riseOnHover: true, opacity: 0.7 })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Work that out')
      .openPopup()
  }
}

const app = new App()
