import { IonAlert, IonContent, IonFab, IonFabButton, IonFabList, IonIcon, IonPage } from '@ionic/react'
import React from 'react'
import { Marker, Popup, TileLayer } from 'react-leaflet'
import { useLandmarks } from '../hooks/useLandmarks'
import { Landmark } from '../types'
import { LoadingIndicator } from '../components/LoadingIndicator'
import MarkerHelper from '../helpers/MarkerHelper'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useLocation } from '../hooks/useLocation'
import { OfflineMapContainer } from '../components/OfflineMapContainer'
import { useTrip } from '../hooks/useTrip'
import { LandmarkMarker } from '../components/LandmarkMarker'
import { businessOutline, folderOpenOutline, mapOutline, settingsOutline, squareOutline } from 'ionicons/icons'
import { LandmarkCompassCard } from '../components/LandmarkCompassCard'
import { WarningPopup } from '../components/WarningPopup'
import 'leaflet-rotatedmarker'
import { useCompassDirection } from '../hooks/useCompassDirection'

export function MapScreen() {
  const { landmarks, isGettingLandmarks, isErrorGettingLandmarks } = useLandmarks('', '')
  const { trip, isGettingTrip, isErrorGettingTrip, endTrip } = useTrip()

  const currentPosition = useLocation()
  const userDirection = useCompassDirection()

  const mapDataLoaded = !isGettingLandmarks && !isErrorGettingLandmarks && !isGettingTrip && !isErrorGettingTrip && landmarks && trip
  const errorLoadingData = isErrorGettingLandmarks || isErrorGettingTrip || !landmarks || !trip
  const locationNotEnabled = currentPosition.lat === 0 && currentPosition.lng === 0

  const cancelTrip = () => {
    endTrip()
  }

  if (errorLoadingData) {
    return <WarningPopup title="Warning" message="Something went wrong while getting landmarks." isOpen={true} />
  }

  if (locationNotEnabled) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <LoadingIndicator text="Loading map..." />
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonContent>
        {isGettingLandmarks || (isGettingTrip && <LoadingIndicator text="Loading landmarks..." />)}
        <OfflineMapContainer center={currentPosition} zoom={18} className="leaflet-container" scrollWheelZoom={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker
            key={userDirection}
            position={[currentPosition.lat, currentPosition.lng]}
            icon={MarkerHelper.getPersonMarker()}
            rotationAngle={userDirection}
          >
            <Popup>You are here</Popup>
          </Marker>

          {/* CLUSTER FOR NO TRIP */}
          {mapDataLoaded && (
            <>
              {!trip.started && (
                <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={18}>
                  {landmarks.map((landmark: Landmark) => (
                    <LandmarkMarker
                      key={landmark.id}
                      landmark={landmark}
                      markerIcon={MarkerHelper.getUnvisitedMarker()}
                      markerIconVisited={MarkerHelper.getVisitedMarker()}
                    />
                  ))}
                </MarkerClusterGroup>
              )}

              {/* TRIP EXISTS*/}
              {trip.started && (
                <>
                  {/* SHOW MARKERS FOR LANDMARKS IN A TRIP */}
                  {landmarks.map(
                    (landmark: Landmark) =>
                      landmark.inTrip && (
                        <LandmarkMarker
                          key={landmark.id}
                          landmark={landmark}
                          markerIcon={MarkerHelper.getUnvisitedInTripMarker()}
                          markerIconVisited={MarkerHelper.getVisitedInTripMarker()}
                        />
                      )
                  )}

                  {/* CLUSTER FOR LANDMARK NOT IN A TRIP */}
                  <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={18}>
                    {landmarks.map(
                      (landmark: Landmark) =>
                        !landmark.inTrip && (
                          <LandmarkMarker
                            key={landmark.id}
                            landmark={landmark}
                            markerIcon={MarkerHelper.getUnvisitedMarker()}
                            markerIconVisited={MarkerHelper.getVisitedMarker()}
                          />
                        )
                    )}
                  </MarkerClusterGroup>
                </>
              )}
            </>
          )}
        </OfflineMapContainer>

        {/* TRIP NOT STARTED */}
        {!trip.started && (
          <>
            <IonFabButton className="btn__home btn__planTrip btn__color" routerLink={'/trip/create'}>
              <IonIcon icon={mapOutline}></IonIcon>
            </IonFabButton>

            <IonFab slot="fixed" color="" vertical="top" horizontal="end">
              <IonFabButton color="light">
                <IonIcon icon={settingsOutline}></IonIcon>
              </IonFabButton>
              <IonFabList side="bottom">
                <IonFabButton routerLink="/settings/extensions">
                  <IonIcon icon={folderOpenOutline}></IonIcon>
                </IonFabButton>
                <IonFabButton routerLink="/settings/areas">
                  <IonIcon icon={businessOutline}></IonIcon>
                </IonFabButton>
              </IonFabList>
            </IonFab>
          </>
        )}

        {/* TRIP STARTED AND NOT THE LAST LANDMARK */}
        {trip.started && (
          <>
            {!trip.isLastVisited && (
              <LandmarkCompassCard
                landmark={trip.landmarks[trip.nextLandmarkId]}
                currentLandmarkNumber={trip.nextLandmarkId + 1}
                totalLandmarks={trip.landmarks.length}
              />
            )}

            <IonFabButton className="btn__home btn__endTrip" color="danger" onClick={cancelTrip}>
              <IonIcon icon={squareOutline}></IonIcon>
            </IonFabButton>
          </>
        )}

        {/* LAST LANDMARK VISITED */}
        {trip.isLastVisited && (
          <IonAlert
            isOpen={true}
            header="Looks like you're done!"
            message="The trip has ended."
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'OK!',
                role: 'confirm',
                handler: () => cancelTrip(),
              },
            ]}
          ></IonAlert>
        )}
      </IonContent>
    </IonPage>
  )
}