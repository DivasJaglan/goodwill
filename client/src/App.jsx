import { useState, useEffect } from "react";

const App = () => {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [error, setError] = useState("");
  const [showRequests, setShowRequests] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Use environment variable for API URL
  // eslint-disable-next-line no-undef
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchItems();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/items`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) {
        if (res.status === 404) return;
        throw new Error("Failed to fetch notifications");
      }
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, isVolunteer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (data.token) {
        setUser({ ...data, isVolunteer: data.isVolunteer });
        setEmail("");
        setPassword("");
        setError("");
        setShowAuth(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, isVolunteer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      if (data.token) {
        setUser({ ...data, isVolunteer: data.isVolunteer });
        setEmail("");
        setPassword("");
        setError("");
        setShowAuth(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setItems([]);
    setNotifications([]);
    setError("");
    setShowRequests(false);
    setShowAuth(false);
  };

  const handlePostItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name: itemName, description: itemDesc }),
      });
      if (!res.ok) throw new Error("Failed to post item");
      setItemName("");
      setItemDesc("");
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestItem = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/api/items/${itemId}/request`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error("Failed to request item");
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignItem = async (itemId, takerId) => {
    try {
      const res = await fetch(`${API_URL}/api/items/${itemId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ takerId: takerId.toString() }),
      });
      if (!res.ok) throw new Error("Failed to assign item");
      fetchItems();
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVolunteerAction = async (itemId, action) => {
    try {
      const res = await fetch(`${API_URL}/api/items/${itemId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`Failed to ${action} item`);
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    if (!showAuth) {
      return (
        <div className="min-h-screen bg-beige-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-[url('path-to-floral-bg')] bg-cover bg-center"></div>
          </div>
          <div className="text-center max-w-3xl z-10">
            <h1 className="text-6xl font-bold text-brown-600 mb-4 uppercase tracking-wide">
              GoodWill
            </h1>
            <p className="text-xl text-brown-500 mb-8">
              Share kindness, connect communities. Donate items you no longer
              need, request what others offer, or volunteer to make a
              difference.
            </p>
            <div className="flex justify-center space-x-6 mb-12">
              <button
                onClick={() => setShowAuth(true)}
                className="bg-peach-400 text-brown-800 px-8 py-4 rounded-full text-lg font-semibold uppercase hover:bg-peach-500 transition-colors shadow-lg"
              >
                Login
              </button>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-pink-300 text-brown-800 px-8 py-4 rounded-full text-lg font-semibold uppercase hover:bg-pink-400 transition-colors shadow-lg"
              >
                Signup
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-brown-600 uppercase mb-2">
                  Donate
                </h3>
                <p className="text-brown-500">
                  Share items you no longer need with those who do.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-brown-600 uppercase mb-2">
                  Request
                </h3>
                <p className="text-brown-500">
                  Find items you need from your community.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-brown-600 uppercase mb-2">
                  Volunteer
                </h3>
                <p className="text-brown-500">
                  Help deliver items and connect people.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-beige-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-4xl font-bold text-brown-600 text-center uppercase mb-6">
            GoodWill
          </h1>
          {error && (
            <p className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-4 rounded-lg border border-brown-200 focus:border-brown-400 focus:ring-2 focus:ring-brown-100 focus:outline-none transition-colors placeholder-brown-400"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-4 rounded-lg border border-brown-200 focus:border-brown-400 focus:ring-2 focus:ring-brown-100 focus:outline-none transition-colors placeholder-brown-400"
            />
            <div className="flex items-center justify-center space-x-2">
              <input
                type="checkbox"
                checked={isVolunteer}
                onChange={() => setIsVolunteer(!isVolunteer)}
                className="w-4 h-4 text-brown-600 border-brown-300 rounded focus:ring-brown-400"
              />
              <label className="text-brown-600">I’m a Volunteer</label>
            </div>
            <button
              type="submit"
              className="w-full bg-peach-400 text-brown-800 p-4 rounded-full uppercase font-semibold hover:bg-peach-500 transition-colors shadow-md"
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleSignup}
              className="w-full bg-pink-300 text-brown-800 p-4 rounded-full uppercase font-semibold hover:bg-pink-400 transition-colors shadow-md"
            >
              Signup
            </button>
            <button
              type="button"
              onClick={() => setShowAuth(false)}
              className="w-full text-brown-600 p-2 hover:underline"
            >
              Back to Home
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user.isVolunteer) {
    return (
      <div className="min-h-screen bg-beige-100 p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-brown-600 uppercase">
            Volunteer Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-400 text-white px-6 py-2 rounded-full uppercase font-semibold hover:bg-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-center mb-6 bg-red-50 p-2 rounded max-w-md mx-auto">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const threeDaysPassed =
              Date.now() - new Date(item.createdAt) >= 3 * 24 * 60 * 60 * 1000;
            return (
              <div
                key={item._id}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <h2 className="text-xl font-semibold text-brown-600 uppercase mb-2">
                  {item.name}
                </h2>
                <p className="text-brown-500 mb-3">{item.description}</p>
                <p className="text-sm text-brown-400">
                  Status: <span className="font-medium">{item.status}</span>
                </p>
                {item.status === "posted" && threeDaysPassed && (
                  <button
                    onClick={() => handleVolunteerAction(item._id, "pickup")}
                    className="mt-4 w-full bg-green-400 text-white p-3 rounded-full uppercase font-semibold hover:bg-green-500 transition-colors"
                  >
                    Pick Up
                  </button>
                )}
                {item.status === "posted" && !threeDaysPassed && (
                  <p className="mt-4 text-brown-500 bg-yellow-50 p-2 rounded">
                    Pickup available after 3 days
                  </p>
                )}
                {item.status === "picked" && item.assignedTo && (
                  <button
                    onClick={() => handleVolunteerAction(item._id, "deliver")}
                    className="mt-4 w-full bg-brown-500 text-white p-3 rounded-full uppercase font-semibold hover:bg-brown-600 transition-colors"
                  >
                    Deliver
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-brown-600 uppercase">
          GoodWill Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-400 text-white px-6 py-2 rounded-full uppercase font-semibold hover:bg-red-500 transition-colors"
        >
          Logout
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-center mb-6 bg-red-50 p-2 rounded max-w-md mx-auto">
          {error}
        </p>
      )}
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-brown-600">
            <span className="font-medium text-brown-600 uppercase">
              Items Given:
            </span>{" "}
            {user.itemsGiven} |{" "}
            <span className="font-medium text-brown-600 uppercase">
              Items Taken:
            </span>{" "}
            {user.itemsTaken}
          </p>
          <button
            onClick={() => setShowRequests(!showRequests)}
            className="bg-brown-500 text-white px-6 py-2 rounded-full uppercase font-semibold hover:bg-brown-600 transition-colors"
          >
            {showRequests ? "Hide Requests" : "View Requests"}
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-brown-600 uppercase mb-2">
              Notifications
            </h2>
            {notifications.map((notif) => (
              <p
                key={notif._id}
                className="text-brown-500 bg-yellow-50 p-3 rounded-lg mb-2"
              >
                {notif.message}
              </p>
            ))}
          </div>
        )}

        {showRequests ? (
          <div>
            <h2 className="text-2xl font-semibold text-brown-600 uppercase mb-4">
              Requested Items
            </h2>
            {items
              .filter(
                (item) =>
                  item.postedBy?._id === user.id &&
                  (item.requestedBy?.length || 0) > 0
              )
              .map((item) => {
                const requestedByArray = Array.isArray(item.requestedBy)
                  ? item.requestedBy
                  : item.requestedBy && typeof item.requestedBy === "object"
                  ? [item.requestedBy]
                  : [];
                return (
                  <div
                    key={item._id}
                    className="bg-beige-50 p-6 rounded-xl shadow-lg mb-4"
                  >
                    <h3 className="text-xl font-semibold text-brown-600 uppercase mb-2">
                      {item.name}
                    </h3>
                    <p className="text-brown-500 mb-2">{item.description}</p>
                    <p className="text-sm text-brown-400">
                      Requests:{" "}
                      <span className="font-medium">
                        {requestedByArray.length}
                      </span>
                    </p>
                    {item.assignedTo ? (
                      <p className="text-green-600 mt-2">
                        Assigned to: {item.assignedTo.email}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {requestedByArray.map((requester) => (
                          <div
                            key={requester._id}
                            className="flex justify-between items-center"
                          >
                            <span className="text-brown-600">
                              {requester.email || "Unknown User"}
                            </span>
                            <button
                              onClick={() =>
                                handleAssignItem(item._id, requester._id)
                              }
                              className="bg-pink-300 text-brown-800 px-4 py-2 rounded-full uppercase font-semibold hover:bg-pink-400 transition-colors"
                            >
                              Give
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <>
            <form onSubmit={handlePostItem} className="mb-8 space-y-6">
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item Name"
                className="w-full p-4 rounded-lg border border-brown-200 focus:border-brown-400 focus:ring-2 focus:ring-brown-100 focus:outline-none transition-colors placeholder-brown-400"
              />
              <textarea
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Item Description"
                className="w-full p-4 rounded-lg border border-brown-200 focus:border-brown-400 focus:ring-2 focus:ring-brown-100 focus:outline-none transition-colors placeholder-brown-400 resize-none h-24"
              />
              <button
                type="submit"
                className="w-full bg-peach-400 text-brown-800 p-4 rounded-full uppercase font-semibold hover:bg-peach-500 transition-colors shadow-md"
              >
                Post Item
              </button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => {
                const requestedByArray = Array.isArray(item.requestedBy)
                  ? item.requestedBy
                  : item.requestedBy && typeof item.requestedBy === "object"
                  ? [item.requestedBy]
                  : [];
                const hasRequested = requestedByArray.some(
                  (r) => r._id === user.id
                );
                return (
                  <div
                    key={item._id}
                    className="bg-beige-50 p-6 rounded-xl shadow-lg"
                  >
                    <h2 className="text-xl font-semibold text-brown-600 uppercase mb-2">
                      {item.name}
                    </h2>
                    <p className="text-brown-500 mb-2">{item.description}</p>
                    <p className="text-sm text-brown-400">
                      Status: <span className="font-medium">{item.status}</span>
                    </p>
                    {item.status === "posted" &&
                      item.postedBy?._id !== user.id &&
                      (hasRequested ? (
                        <p className="mt-3 text-green-600">Item Requested</p>
                      ) : (
                        <button
                          onClick={() => handleRequestItem(item._id)}
                          className="mt-3 w-full bg-brown-500 text-white p-3 rounded-full uppercase font-semibold hover:bg-brown-600 transition-colors"
                        >
                          Request Item
                        </button>
                      ))}
                    {item.status === "posted" &&
                      item.postedBy?._id === user.id && (
                        <p className="mt-3 text-brown-500">
                          Requests:{" "}
                          <span className="font-medium">
                            {requestedByArray.length}
                          </span>
                        </p>
                      )}
                    {item.status === "posted" &&
                      hasRequested &&
                      item.postedBy?._id === user.id &&
                      (item.assignedTo ? (
                        <p className="mt-3 text-green-600">
                          Assigned to: {item.assignedTo.email}
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {requestedByArray.map((requester) => (
                            <div
                              key={requester._id}
                              className="flex justify-between items-center"
                            >
                              <span className="text-brown-600">
                                {requester.email || "Unknown User"}
                              </span>
                              <button
                                onClick={() =>
                                  handleAssignItem(item._id, requester._id)
                                }
                                className="bg-pink-300 text-brown-800 px-4 py-2 rounded-full uppercase font-semibold hover:bg-pink-400 transition-colors"
                              >
                                Give
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    {item.assignedTo?._id === user.id &&
                      item.status === "posted" && (
                        <p className="mt-3 text-green-600">
                          Assigned to you! Please pick up.
                        </p>
                      )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
