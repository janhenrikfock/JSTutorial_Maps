'use strict'

// prettier-ignore
class Workout {
  date = new Date()
  id = (Date.now() + '').slice(-10) //Use smth. like uuid in a real project
  clicks = 0
  constructor(coords, distance, duration) {
    this.coords = coords //[lat, lng]
    this.distance = distance // in km
    this.duration = duration // in min
    
  }
  _setDescription(){
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
  click(){
    this.clicks++
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration)
    this.cadence = cadence
    this.calcPace()
    this._setDescription()
  }
  calcPace() {
    this.pace = this.duration / this.distance
    // A return here is not strictly necessary, since we call the function in the constructor above. However it is good practice.
    return this.pace
  }
}

class Cycling extends Workout {
  type = 'cycling'
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration)
    this.elevationGain = elevationGain
    this.calcSpeed()
    this._setDescription()
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

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')

class App {
  //Private Classfields:
  #map
  #mapZoomLevel = 13
  #mapEvent
  #workouts = []

  constructor() {
    // Get users position
    this._getPosition()
    // Get Data from localstorage
    this._getLocalStorage()

    // Attach eventhandlers
    form.addEventListener('submit', this._newWorkout.bind(this)) //newWorkout is called by a eventlistener. Therefore we have to pass in the this object, otherwise the this keyword in the called function points to the eventlistener and not our app class.
    inputType.addEventListener('change', this._toggleElevationField)
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
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

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map)

    //Handling click on map
    this.#map.on('click', this._showForm.bind(this))

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work)
    })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  _hideForm() {
    //Empty inpust
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ''
    form.style.display = 'none'
    form.classList.add('hidden')
    setTimeout(() => (form.style.display = 'grid'), 1000)
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
  }

  _newWorkout(e) {
    // validate inputs via this helperfunction. This function takes an arbitrary number of numbers in an array (rest parameter ...inputs) and checks each of them wether they are numbers via isFinite.
    const validateInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp))

    const allPositive = (...inputs) => inputs.every(inp => inp > 0)

    e.preventDefault()

    // Get data from form
    const type = inputType.value
    const distance = +inputDistance.value
    const duration = +inputDuration.value
    const { lat, lng } = this.#mapEvent.latlng
    let workout

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value
      // Check if data is valid
      if (
        // !Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)
        !validateInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers')

      workout = new Running([lat, lng], distance, duration, cadence)
    }
    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value
      // Check if data is valid
      if (
        // !Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)
        !validateInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers')
      workout = new Cycling([lat, lng], distance, duration, elevation)
    }
    // Add object to workout array
    this.#workouts.push(workout)

    // Render Workout on map as marker
    this._renderWorkoutMarker(workout)

    // Render Workout on List
    this._renderWorkout(workout)

    // Hide form + clear inputfields
    this._hideForm()
    // Set local storage to all workouts
    this._setLocalStorage()
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords, { riseOnHover: true, opacity: 0.7 })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup()
  }

  _renderWorkout(workout) {
    let html = `
<li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">‍${
        workout.type === 'running' ? '🏃‍♂' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`
    if (workout.type === 'running')
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
</li>
    `
    if (workout.type === 'cycling')
      html += `
    <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationGain}</span>
    <span class="workout__unit">m</span>
  </div>
</li>
    `
    // rendering the workout in the html. Targeting through following line:
    form.insertAdjacentHTML('afterend', html)
  }
  _moveToPopup(e) {
    // On initial render we do not have an element to attach an evenlistener to. So we use closest to search for the right container and attach it to the parent-element.
    const workoutEl = e.target.closest('.workout')

    if (!workoutEl) return

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    )
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    })
    // using the method in the workout class vie the public interface to count clicks. As an example how to call the method of our own class
    // The method is disabled here, because once we restore the object from localstorage the prottypechain gets broken.
    // workout.click()
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts))
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'))
    if (!data) return
    this.#workouts = data
    this.#workouts.forEach(work => {
      this._renderWorkout(work)
      // _renderWorkoutMarker wont work right here, because when we call _getLocalStorage in the constructor the map is not yet loaded. Instead we will call the method later in _loadMap
      // this._renderWorkoutMarker(work)
    })
  }

  // This method never gets called within our code. However it will be contained in the prototype-chain of our app object. We can call this Methd in the console via typing: app.reset()

  reset() {
    localStorage.removeItem('workouts')
    location.reload()
  }
}

const app = new App()
