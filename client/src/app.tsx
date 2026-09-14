import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import { RequireAuth, GuestOnly } from './components/RequireAuth';
import NotFound from './pages/NotFound/NotFound';
import LoginPage from './pages/LoginPage/LoginPage';
import HomePage from './pages/HomePage/HomePage';
import VoicePage from './pages/VoicePage/VoicePage';
import HistoryPage from './pages/HistoryPage/HistoryPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import OnboardingPage from './pages/OnboardingPage/OnboardingPage';
import FamilyPage from './pages/FamilyPage/FamilyPage';
import PrivacyPage from './pages/PrivacyPage/PrivacyPage';
import ProfileEditPage from './pages/ProfileEditPage/ProfileEditPage';
import SharePage from './pages/SharePage/SharePage';
import LandingPage from './pages/LandingPage/LandingPage';
import ChatPage from './pages/ChatPage/ChatPage';
import LanguageStylePage from './pages/LanguageStylePage/LanguageStylePage';
import { UserProvider } from './hooks/useUser';

const RoutesComponent = () => {
  return (
    <UserProvider>
      <Routes>
        <Route
          path="login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route path="landing" element={<LandingPage />} />
        <Route path="share" element={<SharePage />} />
        <Route element={<Layout />}>
          <Route
            index
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="voice"
            element={
              <RequireAuth>
                <VoicePage />
              </RequireAuth>
            }
          />
          <Route
            path="history"
            element={
              <RequireAuth>
                <HistoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="family"
            element={
              <RequireAuth>
                <FamilyPage />
              </RequireAuth>
            }
          />
          <Route
            path="privacy"
            element={
              <RequireAuth>
                <PrivacyPage />
              </RequireAuth>
            }
          />
          <Route
            path="profile-edit"
            element={
              <RequireAuth>
                <ProfileEditPage />
              </RequireAuth>
            }
          />
          <Route
            path="onboarding"
            element={
              <RequireAuth>
                <OnboardingPage />
              </RequireAuth>
            }
          />
          <Route
            path="chat/:familyId"
            element={
              <RequireAuth>
                <ChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="language-style"
            element={
              <RequireAuth>
                <LanguageStylePage />
              </RequireAuth>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserProvider>
  );
};

export default RoutesComponent;
