import * as React from 'react';
import {ChangeEvent, PureComponent} from 'react';

import {IGeoCoordinates} from '../interfaces/ILocation';

const USE_BROWSER_LOCATION = 'USE_BROWSER_LOCATION';
const MANUAL = 'MANUAL';

export interface ISelectLocationProps {
    location: IGeoCoordinates | null;
    useBrowserLocation: boolean;
    onChange: (useBrowserLocation: boolean, location: IGeoCoordinates | null) => void;
    onLocationRequested: () => void;
}

export class SelectLocation extends PureComponent<ISelectLocationProps> {
    constructor(props: ISelectLocationProps) {
        super(props);
        this.handleChangeLatitude = this.handleChangeLatitude.bind(this);
        this.handleChangeLongitude = this.handleChangeLongitude.bind(this);
        this.handleChangeRadio = this.handleChangeRadio.bind(this);
    }

    public handleChangeLatitude(event: ChangeEvent<HTMLInputElement>) {
        let latitudeNumber = Number.parseFloat(event.target.value);
        if (isNaN(latitudeNumber) || latitudeNumber < -90 || latitudeNumber > 90) {
            return;
        }
        latitudeNumber = Math.round(latitudeNumber * 100) / 100;
        const longitude = this.props.location ? this.props.location.longitude : 0;
        this.props.onChange(this.props.useBrowserLocation, {latitude: latitudeNumber, longitude});
    }

    public handleChangeLongitude(event: ChangeEvent<HTMLInputElement>) {
        let longitudeNumber = Number.parseFloat(event.target.value.replace(',', '.'));
        if (isNaN(longitudeNumber) || longitudeNumber < -180 || longitudeNumber > 180) {
            return;
        }
        longitudeNumber = Math.round(longitudeNumber * 100) / 100;
        const latitude = this.props.location ? this.props.location.latitude : 0;
        this.props.onChange(this.props.useBrowserLocation, {latitude, longitude: longitudeNumber});
    }

    public handleChangeRadio(event: ChangeEvent<HTMLInputElement>) {
        switch (event.target.value) {
            case USE_BROWSER_LOCATION:
                this.props.onChange(true, this.props.location);
                break;
            case MANUAL:
                this.props.onChange(false, this.props.location);
                break;
        }
    }

    public render() {
        const {location, useBrowserLocation, onLocationRequested} = this.props;
        return (
            <div className="selectLocation">
                <div className="locationType">
                    <label>
                        <input type="radio" value={USE_BROWSER_LOCATION} checked={useBrowserLocation}
                               onChange={this.handleChangeRadio}/>
                        Standort vom Browser abfragen
                    </label>
                    <label>
                        <input type="radio" value={MANUAL} checked={!useBrowserLocation}
                               onChange={this.handleChangeRadio}/>
                        Standort manuell setzen
                    </label>
                </div>
                {useBrowserLocation ? <div className="browserLocation">
                    <p>Aktueller
                        Standort: {!location ? '(Unbekannt)' : location.latitude + ', ' + location.longitude}</p>
                    <a onClick={onLocationRequested}>Standort aktualisieren</a>
                </div> : ''}
                {!useBrowserLocation ?
                    <div className="manualLocation">
                        <label>
                            Breitengrad:
                            <input type="number" min="-90" max="90" step="0.01"
                                   value={location ? location.latitude : ''}
                                   onChange={this.handleChangeLatitude}/>
                        </label>
                        <label>
                            Längengrad:
                            <input type="number" min="-180" max="180" step="0.01"
                                   value={location ? location.longitude : ''}
                                   onChange={this.handleChangeLongitude}/>
                        </label>
                    </div>
                    : ''}
            </div>
        );
    }
}
