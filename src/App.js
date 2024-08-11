import { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [formData, setFormData] = useState({ qty: '', price: '', type: '' });
  const [loading, setLoading] = useState({ pending: false, completed: false, chart: false });
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(prev => ({ ...prev, pending: true, completed: true, chart: true }));
    try {
      const [pendingResponse, completedResponse] = await Promise.all([
        axios.get('https://order-matching-system-1.onrender.com/api/orders/pending'),
        axios.get('https://order-matching-system-1.onrender.com/api/orders/completed')
      ]);
  
      const pendingOrders = pendingResponse.data;
      const completedOrders = completedResponse.data;
  
      // Handle the pending orders logic
      const buyers = pendingOrders
        .filter(order => order.buyer_qty > 0)
        .map(order => ({
          qty: order.buyer_qty,
          price: order.buyer_price,
        }));
  
      const sellers = pendingOrders
        .filter(order => order.seller_qty > 0)
        .map(order => ({
          qty: order.seller_qty,
          price: order.seller_price,
        }));
  
      setBuyerOrders(buyers);
      setSellerOrders(sellers);
  
      // Handle the completed orders logic
      setCompletedOrders(completedOrders);
  
      const labels = completedOrders.map(order => order.price);
      const data = completedOrders.map(order => order.qty);
  
      setChartData({
        labels: labels,
        datasets: [{
          label: 'Matched Orders',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }],
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders.');
    } finally {
      setLoading(prev => ({ ...prev, pending: false, completed: false, chart: false }));
    }
  };
  

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { qty, price, type } = formData;

    if (!qty || !price || !type) {
      toast.error('Please fill all the fields.');
      return;
    }

    if (qty <= 0 || price <= 0) {
      toast.error('Quantity and price must be positive numbers.');
      return;
    }

    setLoading(prev => ({ ...prev, pending: true }));
    try {
      await axios.post('https://order-matching-system-1.onrender.com/api/order', {
        price,
        qty,
        type,
      });

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed successfully!`);
      setFormData({ qty: '', price: '', type: '' });
      await fetchOrders(); // Refetch both pending and completed orders after submission
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Delay of 2 seconds
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Error submitting order.');
    } finally {
      setLoading(prev => ({ ...prev, pending: false }));
    }
  };

  return (
    <div className="App">
      <ToastContainer />
      <nav className="navbar ">
        <div className="container-fluid">
          <a className="navbar-brand text-align-center" href="#Container">Order Matching System</a>
        </div>
      </nav>
      <div className="container mt-5">
        <div className="row">
          <div className="col-lg-5 border border-rounded pt-3 mb-3">
            <h4>Pending Orders</h4>
            {loading.pending ? (
              <p>Loading Pending Orders...</p>
            ) : (
              <div className="row">
                <div className="col-lg-6">
                  <table className="table border border-rounded">
                    <thead>
                      <tr>
                        <th>Buyer Qty</th>
                        <th>Buyer Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyerOrders.length === 0 ? (
                        <tr><td colSpan="2">No Buyer Orders</td></tr>
                      ) : (
                        buyerOrders.map((order, index) => (
                          <tr key={index}>
                            <td>{order.qty}</td>
                            <td>{order.price}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="col-lg-6">
                  <table className="table border border-rounded">
                    <thead>
                      <tr>
                        <th>Seller Qty</th>
                        <th>Seller Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.length === 0 ? (
                        <tr><td colSpan="2">No Seller Orders</td></tr>
                      ) : (
                        sellerOrders.map((order, index) => (
                          <tr key={index}>
                            <td>{order.qty}</td>
                            <td>{order.price}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="col-lg-4 border border-rounded pt-3 pb-2 mb-3">
            <h4>Order Form</h4>
            <form onSubmit={handleSubmit}>
              <select
                className="form-select"
                name="type"
                value={formData.type}
                onChange={handleChange}
                aria-label="Order Type"
              >
                <option value="" disabled>Select Type</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
              <div className="mb-3 mt-3">
                <label htmlFor="qtyInput" className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  id="qtyInput"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="priceInput" className="form-label">Price</label>
                <input
                  type="number"
                  className="form-control"
                  id="priceInput"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading.pending}>
                {loading.pending ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
          <div className="col-lg-3 border border-rounded pt-3 mb-3">
            <h4>Completed Orders</h4>
            {loading.completed ? (
              <p>Loading Completed Orders...</p>
            ) : (
              <table className="table border border-rounded">
                <thead>
                  <tr>
                    <th>Price</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.length === 0 ? (
                    <tr><td colSpan="2">No Completed Orders</td></tr>
                  ) : (
                    completedOrders.map((order, index) => (
                      <tr key={index}>
                        <td>{order.price}</td>
                        <td>{order.qty}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div className="col-lg-12 border border-rounded pt-3 mb-3">
            <h4>Price Chart</h4>
            {loading.chart ? (
              <p>Loading Chart...</p>
            ) : (
              <div className="chart-container">
              <Chart
                type="bar"
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Price vs Quantity of Matched Orders',
                    },
                  },
                }}
              />
                     </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
