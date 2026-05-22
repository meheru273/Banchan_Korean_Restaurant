import React from 'react'

import {Route, Routes} from "react-router";
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage';
import OrderedListPage from './pages/OrderedListPage';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path = "/" element={<HomePage />} />
        <Route path = "/order" element={<OrderPage />} />
        <Route path = "/ordered-list" element={<OrderedListPage />} />
      </Routes>
    </div>
  )
}

export default App