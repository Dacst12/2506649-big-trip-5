import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import {FormMode, POINT_TYPES} from '../const.js';
import {capitalizeFirstLetter} from '../utils/waypoints.js';
import { toggleArrayElement } from '../utils/common.js';
import flatpickr from 'flatpickr';
import he from 'he';

import 'flatpickr/dist/flatpickr.min.css';

const BLANK_POINT = {
  basePrice: 0,
  dateFrom: '',
  dateTo: '',
  destination: null,
  isFavorite: false,
  offers: [],
  type: 'flight',
};

const BLANK_DESTIONATION = {
  description: '',
  name: '',
  pictures: []
};

const createEventTypeTemplate = (type, checkedAttribute) => (`
  <div class="event__type-item">
    <input id="event-type-${type}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${type}" ${checkedAttribute}>
    <label class="event__type-label  event__type-label--${type}" for="event-type-${type}-1">${capitalizeFirstLetter(type)}</label>
  </div>
`);

const createDestinationsListTemplate = (destination) => (`
  <option value="${destination}"></option>
`);

const createDestinationImageTemplate = ({src, description}) => (`
  <img class="event__photo" src="${src}" alt="${description}">
`);

const createOfferTemplate = ({id, title, price}, checkedAttribute, isDisabled) => (`
  <div class="event__offer-selector">
    <input class="event__offer-checkbox  visually-hidden" id="${id}" type="checkbox" name="event-offer-luggage" ${checkedAttribute} ${isDisabled ? 'disabled' : ''}>
    <label class="event__offer-label" for="${id}">
      <span class="event__offer-title">${title}</span>
      &plus;&euro;&nbsp;
      <span class="event__offer-price">${price}</span>
    </label>
  </div>
`);

const createEditWaypointTemplate = (stateData, destinationsList, mode) => {
  const {point, offers : offersType, destination, isDisabled, isSaving, isDeleting} = stateData;
  const {basePrice, offers : offersPoint, type} = point;
  const {offers} = offersType;
  const {id, name, description, pictures} = destination;
  let textResetButton = mode === FormMode.ADDING ? 'Cancel' : 'Delete';
  textResetButton = isDeleting ? 'Deleting...' : textResetButton;

  return (`
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle-1">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox" ${isDisabled ? 'disabled' : ''}>

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>

    ${POINT_TYPES.map((item) => {
      const checkedAttribute = item === type ? 'checked' : '';
      return createEventTypeTemplate(item, checkedAttribute);
    }).join('')}

              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination-1">
              ${capitalizeFirstLetter(type)}
            </label>
            <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${he.encode(String(name))}" data-id="${id}" list="destination-list-1" ${isDisabled ? 'disabled' : ''}>
            <datalist id="destination-list-1">
              ${destinationsList.map((item) => createDestinationsListTemplate(item.name))}
            </datalist>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time-1">From</label>
            <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="" ${isDisabled ? 'disabled' : ''}>
            &mdash;
            <label class="visually-hidden" for="event-end-time-1">To</label>
            <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="" ${isDisabled ? 'disabled' : ''}>
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-1">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price-1" type="text" name="event-price" value=${he.encode(String(basePrice))} ${isDisabled ? 'disabled' : ''}>
          </div>

          <button class="event__save-btn  btn  btn--blue" type="submit" ${isDisabled ? 'disabled' : ''}>${isSaving ? 'Saving...' : 'Save'}</button>
          <button class="event__reset-btn ${mode === FormMode.EDITING ? 'delete-btn' : 'cancel-btn'}" type="reset">${textResetButton}</button>
          ${mode === FormMode.EDITING ? `<button class="event__rollup-btn" type="button">
            <span class="visually-hidden">Open event</span>
          </button>` : ''}
        </header>
        <section class="event__details">
          ${offers.length !== 0 ? `<section class="event__section  event__section--offers">
              <h3 class="event__section-title  event__section-title--offers">Offers</h3>

              <div class="event__available-offers">

    ${offers.map((offer) => {
      const checkedAttribute = offersPoint.includes(offer.id) ? 'checked' : '';
      return createOfferTemplate(offer, checkedAttribute, isDisabled);
    }).join('')}

              </div>
            </section>` : ''}

          ${description || pictures.length !== 0 ? `<section class="event__section  event__section--destination">
            <h3 class="event__section-title  event__section-title--destination">Destination</h3>
            ${description ? `<p class="event__destination-description">${description}</p>` : ''}

            ${pictures.length !== 0 ? `<div class="event__photos-container">
              <div class="event__photos-tape">
                ${pictures.map((picture) => createDestinationImageTemplate(picture)).join('')}
              </div>
            </div>` : ''}

          </section>` : ''}
        </section>
      </form>
    </li>
  `);
};

export default class EditWaypointView extends AbstractStatefulView {
  #destinationsList = null;
  #handleFormSubmit = null;
  #onCloseForm = null;
  #handleDeleteClick = null;
  #handleDestinationUpdate = null;
  #handleOffersUpdate = null;
  #mode = null;
  #datepickerFrom = null;
  #datepickerTo = null;

  constructor ({point = BLANK_POINT, offers, destination = BLANK_DESTIONATION, destinationsList, handleFormSubmit, onCloseForm, handleDeleteClick, handleDestinationUpdate, handleOffersUpdate}) {
    super();
    this._setState(EditWaypointView.parsePointToState(point, offers, destination));
    this.#destinationsList = destinationsList;
    this.#handleFormSubmit = handleFormSubmit;
    this.#onCloseForm = onCloseForm;
    this.#handleDeleteClick = handleDeleteClick;
    this.#handleDestinationUpdate = handleDestinationUpdate;
    this.#handleOffersUpdate = handleOffersUpdate;

    this.#mode = point === BLANK_POINT ? FormMode.ADDING : FormMode.EDITING;

    this._restoreHandlers();
  }

  get template () {
    return createEditWaypointTemplate(this._state, this.#destinationsList, this.#mode);
  }

  reset (point, offers, destination) {
    this.updateElement(EditWaypointView.parsePointToState(point, offers, destination));
  }

  removeElement() {
    super.removeElement();

    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }

    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }
  }

  _restoreHandlers() {
    this.element.addEventListener('submit', this.#onFormSubmit);
    this.element.querySelector('.event__rollup-btn')?.addEventListener('click', this.#onCloseForm);
    this.element.querySelector('.cancel-btn')?.addEventListener('click', this.#onCloseForm);
    this.element.querySelector('#event-destination-1').addEventListener('change', this.#onDestinationChange);
    this.element.querySelector('.event__type-list').addEventListener('change', this.#onTypeClick);
    this.element.querySelector('#event-price-1').addEventListener('input', this.#onPriceInput);
    this.element.querySelector('.event__available-offers')?.addEventListener('click', this.#onOfferClick);
    this.element.querySelector('.delete-btn')?.addEventListener('click', this.#onDeleteClick);

    this.#setDatepickers();
  }

  #onFormSubmit = (evt) => {
    evt.preventDefault();
    if (!this._state.point.destination || !this._state.point.type) {
      return;
    }

    this.#handleFormSubmit(EditWaypointView.parseStateToPoint(this._state));
  };

  #onDeleteClick = (evt) => {
    evt.preventDefault();
    this.#handleDeleteClick(EditWaypointView.parseStateToPoint(this._state));
  };

  #onPriceInput = (evt) => {
    evt.preventDefault();
    const inputNumber = evt.target.value;
    const isNumber = typeof Number(inputNumber) === 'number' && !isNaN(Number(inputNumber));

    if (!isNumber && inputNumber.length !== 0) {
      evt.target.value = inputNumber.slice(0,-1);
      return;
    }

    const updatedPrice = Number(inputNumber);
    this._setState({
      point: {
        ...this._state.point,
        basePrice: updatedPrice,
      }
    });
  };

  #onDestinationChange = (evt) => {
    evt.preventDefault();
    const isDestinationFromList = this.#destinationsList.some(
      (destination) => destination.name === evt.target.value);

    if (!evt.target.value || !isDestinationFromList) {
      evt.target.value = '';
      return;
    }

    const updatedDestination = this.#handleDestinationUpdate(evt.target.value);
    this.updateElement({
      point:{
        ...this._state.point,
        destination: updatedDestination.id
      },
      destination: updatedDestination
    });
  };

  #onTypeClick = (evt) => {
    evt.preventDefault();

    const clickedElement = evt.target;
    if (!clickedElement.closest('.event__type-input')) {
      return;
    }

    const updatedType = clickedElement.value;
    const updatedOffers = this.#handleOffersUpdate(updatedType);

    this.updateElement({
      point: {
        ...this._state.point,
        type: updatedType,
        offers: []
      },
      offers: updatedOffers,
    });
  };

  #onOfferClick = (evt) => {
    const clickedElement = evt.target;
    if (!clickedElement.closest('.event__offer-checkbox')) {
      return;
    }

    const updatedOfferId = clickedElement.id;
    const updatedOffers = toggleArrayElement(this._state.point.offers, updatedOfferId);

    this._setState({
      point: {
        ...this._state.point,
        offers: updatedOffers
      }
    });
  };

  #onDateFromChange = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateFrom: userDate.toISOString()
      }
    });
  };

  #onDateToChange = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateTo: userDate.toISOString()
      }
    });
  };

  #setDatepickers() {
    const defaultConfig = {
      dateFormat: 'd/m/y H:i',
      enableTime: true,
      'time_24hr': true,
    };

    this.#datepickerFrom = flatpickr(
      this.element.querySelector('#event-start-time-1'),
      {
        ...defaultConfig,
        defaultDate: new Date(this._state.point.dateFrom),
        maxDate: new Date(this._state.point.dateTo),
        onChange: this.#onDateFromChange
      }
    );

    this.#datepickerTo = flatpickr(
      this.element.querySelector('#event-end-time-1'),
      {
        ...defaultConfig,
        defaultDate: new Date(this._state.point.dateTo),
        minDate: new Date(this._state.point.dateFrom),
        onChange: this.#onDateToChange
      }
    );
  }

  static parsePointToState(point, offers, destination) {
    return {
      point,
      offers,
      destination,
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
    };
  }

  static parseStateToPoint(state) {
    const waypoint = {
      ...state,
      offersList: state.offers
    };

    delete waypoint.offers;
    delete waypoint.isDisabled;
    delete waypoint.isSaving;
    delete waypoint.isDeleting;

    return waypoint;
  }
}
