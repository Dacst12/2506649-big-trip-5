import EventsPresenter from './presenter/events-presenter.js';
import TripModel from './model/trip-model.js';
import FilterModel from './model/filter-model.js';
import FilterPresenter from './presenter/filter-presenter.js';
import WaypointsApiService from './waypoints-api-service.js';

const AUTHORIZATION = 'Basic d8k0ts8a7cs65t';
const END_POINT = 'https://24.objects.htmlacademy.pro/big-trip';

const filtersContainer = document.querySelector('.trip-controls__filters');
const eventsContainer = document.querySelector('.trip-events');
const headerContainer = document.querySelector('.trip-main');

const waypointsApiService = new WaypointsApiService(END_POINT, AUTHORIZATION);

const tripModel = new TripModel({waypointsApiService});
const filterModel = new FilterModel();

const eventsPresenter = new EventsPresenter({
  eventsContainer,
  tripModel,
  filterModel,
  headerContainer
});
const filterPresenter = new FilterPresenter({filtersContainer, filterModel, tripModel});

filterPresenter.init();
eventsPresenter.init();
tripModel.init();
