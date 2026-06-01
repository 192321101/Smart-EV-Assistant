import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { StationProvider } from './context/StationContext';
import { BookingProvider } from './context/BookingContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { VoiceProvider } from './context/VoiceContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VehicleProvider>
          <TelemetryProvider>
            <StationProvider>
              <BookingProvider>
                <VoiceProvider>
                  <AppRoutes />
                </VoiceProvider>
              </BookingProvider>
            </StationProvider>
          </TelemetryProvider>
        </VehicleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
