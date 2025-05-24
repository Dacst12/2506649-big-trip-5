import AbstractView from '../framework/view/abstract-view.js';

const createTripRouteTemplate = (tripRoute) => `
  <h1 class="trip-info__title">
    ${tripRoute[0]} &mdash; ${tripRoute.length > 3 ? '...' : tripRoute[1]} &mdash; ${tripRoute.at(-1)}
  </h1>
`;

const createTripInfoTemplate = (tripRoute, tripDuration, totalCost) => `
  <section class="trip-main__trip-info  trip-info">
    <div class="trip-info__main">
      ${createTripRouteTemplate(tripRoute)}

      <p class="trip-info__dates">${tripDuration[0]}&nbsp;&mdash;&nbsp;${tripDuration[1]}</p>
    </div>

    <p class="trip-info__cost">
      Total: &euro;&nbsp;<span class="trip-info__cost-value">${totalCost}</span>
    </p>
  </section>
`;


export default class TripInfoView extends AbstractView {
  #totalCost = null;
  #tripRoute = null;
  #tripDuration = null;

  constructor({totalCost, tripRoute, tripDuration}) {
    super();
    this.#totalCost = totalCost;
    this.#tripRoute = tripRoute;
    this.#tripDuration = tripDuration;
  }

  get template() {
    return createTripInfoTemplate(this.#tripRoute, this.#tripDuration, this.#totalCost);
  }
}
