import AbstractView from '../framework/view/abstract-view.js';

const createErrorLoadingTemplate = () => `
  <p class="trip-events__msg">Failed to load latest route information</p>
`;

export default class ErrorLoadingView extends AbstractView {
  get template() {
    return createErrorLoadingTemplate();
  }
}

