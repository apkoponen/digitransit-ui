import React, { PropTypes, Component } from 'react';
import Relay from 'react-relay';
import Departure from './Departure';
import filter from 'lodash/filter';
import get from 'lodash/get';
import moment from 'moment';
import Link from 'react-router/lib/Link';
import cx from 'classnames';
import connectToStores from 'fluxible-addons-react/connectToStores';

const mergeDepartures = departures =>
  Array.prototype.concat.apply([], departures).sort((a, b) => a.stoptime - b.stoptime);

const asDepartures = stoptimes =>
  stoptimes.map(pattern =>
    pattern.stoptimes.map(stoptime => {
      const canceled = stoptime.realtimeState === 'CANCELED' ||
        window.mock && stoptime.realtimeDeparture % 40 === 0;
      const stoptimeTime = stoptime.serviceDay +
        (stoptime.realtimeState === 'CANCELED'
          ? stoptime.scheduledDeparture
          : stoptime.realtimeDeparture);

      return {
        canceled,
        stop: stoptime.stop,
        stoptime: stoptimeTime,
        realtime: stoptime.realtime,
        pattern: pattern.pattern,
        trip: stoptime.trip,
      };
    })
  );

class DepartureListContainer extends Component {
  static propTypes = {
    relay: PropTypes.object.isRequired,
    rowClasses: PropTypes.string.isRequired,
    stoptimes: PropTypes.array.isRequired,
    currentTime: PropTypes.object.isRequired,
    limit: PropTypes.number,
    pattern: PropTypes.object,
    infiniteScroll: PropTypes.bool,
    showStops: PropTypes.bool,
    routeLinks: PropTypes.bool,
    className: PropTypes.string,
  };

  static contextTypes = {
    getStore: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.getDepartures = this.getDepartures.bind(this);
    this.render = this.render.bind(this);
  }

  onScroll = () => {
    if (this.props.infiniteScroll && typeof window !== 'undefined' && window !== null) {
      return this.scrollHandler;
    }
    return null;
  };

  getDepartures(rowClasses) {
    const departureObjs = [];
    const currentTime = this.props.currentTime.unix();
    let currentDate = this.props.currentTime.clone()
      .startOf('day')
      .unix();
    let tomorrow = this.props.currentTime.clone()
      .add(1, 'day')
      .startOf('day')
      .unix();

    const departures = mergeDepartures(asDepartures(this.props.stoptimes))
      .filter(departure => currentTime < departure.stoptime).slice(0, this.props.limit);

    for (let departure of departures) {
      if (departure.stoptime >= tomorrow) {
        departureObjs.push(
          <div
            key={moment(departure.stoptime * 1000).format('DDMMYYYY')}
            className="date-row border-bottom"
          >
            {moment(departure.stoptime * 1000).format('dddd D.M.YYYY')}
          </div>);

        currentDate = tomorrow;
        tomorrow = moment.unix(currentDate)
          .add(1, 'day')
          .startOf('day')
          .unix();
      }

      const id = `${departure.pattern.code} : ${departure.stoptime}`;

      const validAt = alert =>
      alert.effectiveStartDate <= departure.stoptime &&
      departure.stoptime <= alert.effectiveEndDate &&
      (get(alert.trip.gtfsId) === get(departure.trip.gtfsId));


      const classes = {
        disruption: filter(departure.pattern.alerts, validAt).length > 0,
        canceled: departure.canceled,
      };

      if (rowClasses) {
        classes[rowClasses] = true;
      }

      if (this.props.routeLinks) {
        departureObjs.push(
          <Link to={`/linjat/${departure.pattern.code}`} key={id}>
            <Departure
              departure={departure}
              showStop={this.props.showStops}
              currentTime={currentTime}
              className={cx(classes)}
              canceled={departure.canceled}
            />
          </Link>);
      } else {
        departureObjs.push(
          <Departure
            key={id}
            departure={departure}
            showStop={this.props.showStops}
            currentTime={currentTime}
            className={cx(classes)}
            canceled={departure.canceled}
          />);
      }
    }

    return departureObjs;
  }

  render() {
    return (
      <div
        className={cx('departure-list', this.props.className)}
        onScroll={this.onScroll()}
      >
        {this.getDepartures(this.props.rowClasses)}
      </div>);
  }
}

const DepartureListContainerWithTime = connectToStores(DepartureListContainer, ['TimeStore'],
  (context) => ({ currentTime: context.getStore('TimeStore').getCurrentTime() })
);

export const relayFragment = {
  stoptimes: () => Relay.QL`
    fragment on StoptimesInPattern @relay(plural:true) {
      pattern {
        alerts {
          effectiveStartDate
          effectiveEndDate
          trip {
            gtfsId
          }
        }
        route {
          gtfsId
          shortName
          longName
          type
          color
        }
        code
        headsign
      }
      stoptimes {
        realtimeState
        realtimeDeparture
        scheduledDeparture
        realtime
        serviceDay
        stop {
          code
        }
        trip {
          gtfsId
        }
      }
    }
  `,
};

export default Relay.createContainer(DepartureListContainerWithTime, {
  fragments: relayFragment,
});