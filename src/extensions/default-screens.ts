import type React from 'react';
import { AccountScreen, DeleteAccountScreen, EditProfileScreen, HelpScreen } from '../screens/account';
import { SignInScreen } from '../screens/auth';
import { ChooseScreen, DestinationScreen, HomeScreen } from '../screens/booking';
import { ChatScreen } from '../screens/chat';
import { EditPlaceScreen, PlacesScreen } from '../screens/places';
import { PayScreen, RateScreen, RideScreen } from '../screens/ride';
import { ReceiptScreen, TripScreen, TripsScreen } from '../screens/trips';
import type { ScreenId } from './screens/screen-ids';

export const defaultScreens: Record<ScreenId, React.ComponentType<any>> = {
    'auth.signIn': SignInScreen,
    'booking.home': HomeScreen,
    'booking.destination': DestinationScreen,
    'booking.choose': ChooseScreen,
    'ride.active': RideScreen,
    'ride.chat': ChatScreen,
    'ride.pay': PayScreen,
    'ride.rate': RateScreen,
    'account.home': AccountScreen,
    'account.editProfile': EditProfileScreen,
    'account.delete': DeleteAccountScreen,
    'account.help': HelpScreen,
    'trips.list': TripsScreen,
    'trips.detail': TripScreen,
    'trips.receipt': ReceiptScreen,
    'places.list': PlacesScreen,
    'places.edit': EditPlaceScreen,
};
