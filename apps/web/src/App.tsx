import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { BreedDetail } from './screens/BreedDetail';
import { Breeds } from './screens/Breeds';
import { DogProfile } from './screens/DogProfile';
import { EditDog } from './screens/EditDog';
import { ForgotPassword } from './screens/ForgotPassword';
import { Home } from './screens/Home';
import { Onboard } from './screens/Onboard';
import { ResetPassword } from './screens/ResetPassword';
import { ScoutChat } from './screens/ScoutChat';
import { ScoutList } from './screens/ScoutList';
import { SignIn } from './screens/SignIn';
import { SignUp } from './screens/SignUp';
import { VerifyEmail } from './screens/VerifyEmail';

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/onboard"
        element={
          <RequireAuth>
            <Onboard />
          </RequireAuth>
        }
      />
      <Route
        path="/dogs/:id"
        element={
          <RequireAuth>
            <DogProfile />
          </RequireAuth>
        }
      />
      <Route
        path="/dogs/:id/edit"
        element={
          <RequireAuth>
            <EditDog />
          </RequireAuth>
        }
      />
      <Route
        path="/breeds"
        element={
          <RequireAuth>
            <Breeds />
          </RequireAuth>
        }
      />
      <Route
        path="/breeds/:slug"
        element={
          <RequireAuth>
            <BreedDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/scout"
        element={
          <RequireAuth>
            <ScoutList />
          </RequireAuth>
        }
      />
      <Route
        path="/scout/:id"
        element={
          <RequireAuth>
            <ScoutChat />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
