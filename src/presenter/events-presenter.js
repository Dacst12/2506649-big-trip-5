import {remove, render, RenderPosition} from '../framework/render.js';
import SortingView from '../view/sorting.js';
import EventsListView from '../view/events-list.js';
import NoWaypointsView from '../view/no-waypoints.js';
import WaypointPresenter from './waypoint-presenter.js';
import {FilterType, NewWaypointButtonMode, SortType, TimeLimit, UpdateType, UserAction}
  from '../const.js';
import {getTotalBasePrice, getTripDuration, getTripRouteIds, getWaypointAddOptionalPrice, sortByDate, sortByPrice, sortByTime} from '../utils/waypoints.js';
import { filter } from '../utils/filter.js';
import NewWaypointPresenter from './new-waypoint-presenter.js';
import NewWaypointButton from '../view/new-waypoint-button.js';
import LoadingView from '../view/loading.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import ErrorLoadingView from '../view/error-loading.js';
import TripInfoView from '../view/trip-info.js';

export default class EventsPresenter {
  #container = null;
  #tripModel = null;
  #filterModel = null;
  #headerContainer = null;

  #sortingComponent = null;
  #noWaypointsComponent = null;
  #eventsListComponent = new EventsListView();
  #newWaypointButtonComponent = null;
  #loadingComponent = new LoadingView();
  #errorLoadingComponent = new ErrorLoadingView();
  #tripInfoComponent = null;

  #NewWaypointButtonMode = NewWaypointButtonMode.ENABLED;

  #waypointPresenters = new Map();
  #newWaypointPresenter = null;

  #currentSort = SortType.DAY;
  #currentFilter = FilterType.EVERYTHING;
  #isLoading = true;
  #isError = false;
  #uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT
  });

  constructor({eventsContainer: container, tripModel, filterModel, headerContainer}) {
    this.#container = container;
    this.#tripModel = tripModel;
    this.#filterModel = filterModel;
    this.#headerContainer = headerContainer;

    this.#tripModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  init() {
    this.#renderEvents();
  }

  #createWaypoint () {
    this.#currentSort = SortType.DAY;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);

    this.#renderNewWaypointPresenter();
    this.#newWaypointPresenter.init();
  }

  get waypoints() {
    this.#currentFilter = this.#filterModel.filter;
    const waypoints = this.#tripModel.waypoints;
    const filteredWaypoints = filter[this.#currentFilter](waypoints);

    switch (this.#currentSort) {
      case SortType.TIME:
        return filteredWaypoints.sort(sortByTime);
      case SortType.PRICE:
        return filteredWaypoints.sort(sortByPrice);
      default:
        return filteredWaypoints.sort(sortByDate);
    }
  }

  #updateWaypointPresentersData = (updatedPoint) => {
    const destinationsList = this.#tripModel.destinations;
    const destination = this.#tripModel.getDestinationById(updatedPoint.destination);
    const offersList = this.#tripModel.getOffersByType(updatedPoint.type);
    this.#waypointPresenters.get(updatedPoint.id).init({
      point: updatedPoint,
      destination,
      offersList,
      destinationsList
    });
  };

  #handleViewAction = async (actionType, updateType, updatedWaypoint) => {
    this.#uiBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_WAYPOINT:
        this.#waypointPresenters.get(updatedWaypoint.id).setSaving();
        try {
          await this.#tripModel.updateWaypoint(updateType, updatedWaypoint);
        } catch (error) {
          this.#waypointPresenters.get(updatedWaypoint.id).setAborting();
        }
        break;

      case UserAction.ADD_WAYPOINT:
        this.#newWaypointPresenter.setSaving();
        try {
          await this.#tripModel.addWaypoint(updateType, updatedWaypoint);
          this.#newWaypointPresenter.destroy();
        } catch(error) {
          this.#newWaypointPresenter.setAborting();
        }
        break;

      case UserAction.DELETE_WAYPOINT:
        this.#waypointPresenters.get(updatedWaypoint.id).setDeleting();
        try {
          await this.#tripModel.deleteWaypoint(updateType, updatedWaypoint);
        } catch (error) {
          this.#waypointPresenters.get(updatedWaypoint.id).setAborting();
        }
        break;
    }

    this.#uiBlocker.unblock();
  };

  #handleModelEvent = (updateType, updatedWaypoint) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#updateWaypointPresentersData(updatedWaypoint);
        break;
      case UpdateType.MINOR:
        this.#clearEvents();
        this.#renderEvents();
        break;
      case UpdateType.MAJOR:
        this.#clearEvents({resetSortType: true});
        this.#renderEvents();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderEvents();
        break;
      case UpdateType.ERROR:
        this.#isError = true;
        this.#clearEvents();
        this.#renderEvents();
        break;
    }
  };

  #resetWaypointsMode = () => {
    this.#waypointPresenters.forEach((waypointPresenter) => waypointPresenter.resetToDefaultWaypoint());
  };

  #clearEvents({resetSortType = false} = {}) {
    this.#waypointPresenters.forEach((waypointPresenter) => waypointPresenter.destroy());
    this.#waypointPresenters.clear();

    this.#NewWaypointButtonMode = NewWaypointButtonMode.ENABLED;

    remove(this.#sortingComponent);
    remove(this.#noWaypointsComponent);
    remove(this.#tripInfoComponent);

    if (resetSortType) {
      this.#currentSort = SortType.DAY;
    }
  }

  #handleDestinationUpdate = (updatedName) => {
    const updatedDestination = this.#tripModel.getDestinationByName(updatedName);

    return updatedDestination;
  };

  #handleOffersUpdate = (updatedType) => {
    const updatedOffers = this.#tripModel.getOffersByType(updatedType);

    return updatedOffers;
  };

  #changeNewWaypointButtonModeAndRerender = () => {
    this.#NewWaypointButtonMode = NewWaypointButtonMode.ENABLED;
    this.#renderNewWaypointButton();
  };

  #renderNewWaypointPresenter() {
    this.#newWaypointPresenter = new NewWaypointPresenter({
      eventsListContainer: this.#eventsListComponent,
      handleWaypointsDataUpdate: this.#handleViewAction,
      offers: this.#tripModel.getOffersByType('flight'),
      destinationsList: this.#tripModel.destinations,
      handleDestinationUpdate: this.#handleDestinationUpdate,
      handleOffersUpdate: this.#handleOffersUpdate,
      changeNewWaypointButtonModeAndRerender: this.#changeNewWaypointButtonModeAndRerender
    });
  }

  #renderNewWaypointButton() {
    if (this.#newWaypointButtonComponent !== null) {
      remove(this.#newWaypointButtonComponent);
    }

    this.#newWaypointButtonComponent = new NewWaypointButton({
      mode: this.#NewWaypointButtonMode,
      onClick: this.#onNewWaypointButtonClick
    });

    render(this.#newWaypointButtonComponent, this.#headerContainer);
  }

  #renderWaypoint(point, destinationsList, destination, offersList) {
    const waypointPresenter = new WaypointPresenter({
      eventsListComponent: this.#eventsListComponent.element,
      handleWaypointsDataUpdate: this.#handleViewAction,
      resetWaypointsMode: this.#resetWaypointsMode,
      handleDestinationUpdate: this.#handleDestinationUpdate,
      handleOffersUpdate: this.#handleOffersUpdate,
    });

    waypointPresenter.init({point, destinationsList, destination, offersList});
    this.#waypointPresenters.set(point.id, waypointPresenter);
  }

  #renderWaypoints() {
    const destinationsList = this.#tripModel.destinations;

    this.waypoints.map((point) => {
      const destination = this.#tripModel.getDestinationById(point.destination);
      const offersList = this.#tripModel.getOffersByType(point.type);

      this.#renderWaypoint(point, destinationsList, destination, offersList);
    });
  }

  #renderNoWaypoints() {
    this.#noWaypointsComponent = new NoWaypointsView({filterType: this.#currentFilter});

    render(this.#noWaypointsComponent, this.#container);
  }

  #applySort = (sortType) => {
    if (sortType === this.#currentSort) {
      return;
    }

    this.#currentSort = sortType;
    this.#clearEvents();
    this.#renderEvents();
  };

  #renderSorting() {
    this.#sortingComponent = new SortingView({
      currentSort: this.#currentSort,
      applySort: this.#applySort
    });

    render(this.#sortingComponent, this.#container);
  }

  #renderEventsList() {
    render(this.#eventsListComponent, this.#container);
  }

  #renderLoading () {
    render(this.#loadingComponent, this.#container);
  }

  #renderErrorLoading() {
    render(this.#errorLoadingComponent, this.#container);
  }

  #renderTripInfo() {
    const defaultWaypoints = this.#tripModel.waypoints;

    const tripRouteIds = getTripRouteIds(defaultWaypoints);
    const tripRoute = tripRouteIds.map((destinationId) =>
      this.#tripModel.getDestinationById(destinationId).name);

    const tripDuration = getTripDuration(defaultWaypoints);

    const totalBasePrice = getTotalBasePrice(defaultWaypoints);
    const totalAddOptionalPrice = defaultWaypoints.reduce((totalPrice, currentWaypoint) => {
      const offers = this.#tripModel.getOffersByType(currentWaypoint.type);
      const currentWaypointAddOptionalPrice = getWaypointAddOptionalPrice(currentWaypoint, offers);

      return currentWaypointAddOptionalPrice + totalPrice;
    }, 0);

    const totalCost = totalBasePrice + totalAddOptionalPrice;

    this.#tripInfoComponent = new TripInfoView({tripRoute, tripDuration, totalCost});
    render(this.#tripInfoComponent, this.#headerContainer, RenderPosition.AFTERBEGIN);
  }

  #renderEvents() {
    if (this.#isError) {
      this.#renderErrorLoading();
    }

    if (this.#isLoading) {
      this.#renderLoading();
    }

    if (this.#isError || this.#isLoading) {
      this.#NewWaypointButtonMode = NewWaypointButtonMode.DISABLED;
      this.#renderNewWaypointButton();
      return;
    }

    this.#NewWaypointButtonMode = NewWaypointButtonMode.ENABLED;
    this.#renderNewWaypointButton();

    if (!this.waypoints.length) {
      this.#renderNoWaypoints();
      return;
    }
    this.#renderTripInfo();
    this.#renderSorting();
    this.#renderEventsList();
    this.#renderWaypoints();
  }

  #onNewWaypointButtonClick = (evt) => {
    evt.preventDefault();

    this.#createWaypoint();
    this.#NewWaypointButtonMode = NewWaypointButtonMode.DISABLED;
    this.#renderNewWaypointButton();
  };
}
