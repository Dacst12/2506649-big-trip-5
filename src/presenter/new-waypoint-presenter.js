import {UpdateType, UserAction } from '../const.js';
import { remove, render, RenderPosition } from '../framework/render.js';
import EditWaypointView from '../view/edit-form.js';

export default class NewWaypointPresenter {
  #eventsListContainer = null;
  #handleWaypointsDataUpdate = null;
  #offers = null;
  #destinationsList = null;
  #handleDestinationUpdate = null;
  #handleOffersUpdate = null;
  #handleCloseForm = null;

  #waypointEditComponent = null;

  constructor({
    eventsListContainer,
    handleWaypointsDataUpdate,
    offers,
    destinationsList,
    handleDestinationUpdate,
    handleOffersUpdate,
    handleCloseForm
  }) {
    this.#eventsListContainer = eventsListContainer;
    this.#handleWaypointsDataUpdate = handleWaypointsDataUpdate;
    this.#offers = offers;
    this.#destinationsList = destinationsList;
    this.#handleDestinationUpdate = handleDestinationUpdate;
    this.#handleOffersUpdate = handleOffersUpdate;
    this.#handleCloseForm = handleCloseForm;
  }

  init() {
    if (this.#waypointEditComponent !== null) {
      return;
    }

    this.#waypointEditComponent = new EditWaypointView({
      offers: this.#offers,
      destinationsList: this.#destinationsList,
      handleFormSubmit: this.#handleFormSubmit,
      onCloseForm: this.#onCloseForm,
      handleDestinationUpdate: this.#handleDestinationUpdate,
      handleOffersUpdate: this.#handleOffersUpdate,
    });

    render(this.#waypointEditComponent, this.#eventsListContainer.element, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy() {
    if (this.#waypointEditComponent === null) {
      return;
    }

    this.#handleCloseForm();

    remove(this.#waypointEditComponent);
    this.#waypointEditComponent = null;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  setSaving() {
    this.#waypointEditComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setAborting() {
    const resetFormState = () => {
      this.#waypointEditComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#waypointEditComponent.shake(resetFormState);
  }

  #handleFormSubmit = (waypoint) => {
    this.#handleWaypointsDataUpdate(
      UserAction.ADD_WAYPOINT,
      UpdateType.MINOR,
      waypoint.point,
    );
  };

  #onCloseForm = (evt) => {
    evt.preventDefault();

    this.destroy();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.destroy();
    }
  };
}
