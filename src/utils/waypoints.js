import dayjs from 'dayjs';
import {SHORT_DATE_FORMAT, TIME_FORMAT, SHORT_DEFAULT_FORMAT, FULL_DATE_FORMAT} from '../const.js';

const formatDate = (date, dateFormat) => (date ? dayjs(date).format(dateFormat) : '');
const humanizeDate = (date) => (formatDate(date, SHORT_DATE_FORMAT));
const humanizeTime = (date) => (formatDate(date, TIME_FORMAT));
const formatToShortDefaultDate = (date) => (formatDate(date, SHORT_DEFAULT_FORMAT));
const formatToDefaultDate = (date) => (formatDate(date, `${SHORT_DEFAULT_FORMAT}T${TIME_FORMAT}`));
const formatToFullDate = (date) => (formatDate(date, FULL_DATE_FORMAT));

const capitalizeFirstLetter = (word) => (String(word).charAt(0).toUpperCase() + String(word).slice(1));

const getTimeDuration = (dateFrom, dateTo) => {
  const startDate = dayjs(dateFrom);
  const endDate = dayjs(dateTo);

  return endDate.diff(startDate, 'minute');
};

const humanizeTimeDuration = (dateFrom, dateTo) => {
  const differenceInMinutes = getTimeDuration(dateFrom, dateTo);
  const countDays = Math.floor(differenceInMinutes / 60 / 24);
  const countHours = Math.floor(differenceInMinutes / 60) - countDays * 24;
  const countMinutes = differenceInMinutes % 60;

  const days = countDays >= 10 ? `${countDays}D` : `0${countDays}D`;
  const hours = countHours >= 10 ? `${countHours}H` : `0${countHours}H`;
  const minutes = countMinutes >= 10 ? `${countMinutes}M` : `0${countMinutes}M`;

  const timeDuration = `${countDays ? days : ''} ${countHours ? hours : ''} ${countMinutes ? minutes : ''}`;
  return timeDuration;
};

const sortByDate = (waypointA, waypointB) => {
  const dateA = dayjs(waypointA.dateFrom);
  const dateB = dayjs(waypointB.dateFrom);

  return dateA.diff(dateB, 'minute');
};

const sortByTime = (waypointA, waypointB) => {
  const timeDurationA = getTimeDuration(waypointA.dateFrom, waypointA.dateTo);
  const timeDurationB = getTimeDuration(waypointB.dateFrom, waypointB.dateTo);

  return timeDurationB - timeDurationA;
};

const sortByPrice = (waypointA, waypointB) => {
  const priceA = waypointA.basePrice;
  const priceB = waypointB.basePrice;

  return priceB - priceA;
};

const isDatesEqual = (dateA, dateB) =>
  (dateA === null && dateB === null) || dayjs(dateA).isSame(dateB, 'D');

const getTripRouteIds = (waypoints) =>
  Array.from(new Set(waypoints.map(({destination}) => destination)));

const getTripDuration = (waypoints) => {
  const startDate = waypoints[0].dateFrom;
  const endDate = waypoints.at(-1).dateTo;

  const formattedStartDate = dayjs(startDate).isSame(endDate, 'M') ? formatDate(startDate, 'D') :
    formatDate(startDate, 'D MMM');
  const formattedEndDate = formatDate(endDate, 'D MMM');

  return [formattedStartDate, formattedEndDate];
};

const getTotalBasePrice = (waypoints) => waypoints.reduce((totalPrice, currentWaypoint) =>
  totalPrice + currentWaypoint.basePrice, 0);

const getPriceByOfferId = (offerId, offers) => offers.find(({id}) => id === offerId).price;

const getWaypointAddOptionalPrice = (waypoint, offers) =>
  waypoint.offers.reduce((totalPrice, currentOfferId) =>
    totalPrice + getPriceByOfferId(currentOfferId, offers.offers), 0);

export {humanizeDate, humanizeTime, formatToShortDefaultDate, formatToDefaultDate, formatToFullDate, capitalizeFirstLetter, getTimeDuration, humanizeTimeDuration, sortByDate, sortByTime, sortByPrice, isDatesEqual, getTripRouteIds, getTripDuration, getTotalBasePrice, getWaypointAddOptionalPrice};
