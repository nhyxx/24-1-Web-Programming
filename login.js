// login.js

const fs = require("fs-extra");
const path = require("path");
const usersFilePath = path.join(__dirname, "users.json");

const loadUsers = async () => {
  try {
    const data = await fs.readFile(usersFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading users:", err);
    return [];
  }
};

const saveUsers = async (users) => {
  try {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving users:", err);
  }
};

const register = async (req, res) => {
  const { email, password } = req.body;
  let users = await loadUsers();
  const existingUser = users.find((u) => u.email === email);

  if (existingUser) {
    return res
      .status(409)
      .json({ success: false, message: "이미 존재하는 이메일입니다." });
  }

  const newUser = {
    id: users.length + 1,
    email,
    password,
    reservations: [], // 새로운 사용자 객체에 예약 배열 추가
  };

  users.push(newUser);
  await saveUsers(users);
  res.json({ success: true, message: "회원가입 성공" });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const users = await loadUsers();
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    req.session.userId = user.id;
    req.session.email = user.email;
    res.json({ success: true, message: "로그인 성공" });
  } else {
    res.status(401).json({
      success: false,
      message: "이메일 또는 비밀번호가 잘못되었습니다.",
    });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "로그아웃 실패" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "로그아웃 성공" });
  });
};

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/");
};

const addReservation = async (req, res) => {
  const { userId } = req.session;
  const {
    movieTitle,
    director,
    cast,
    summary,
    viewdate,
    viewtime,
    forceReservation,
  } = req.body;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "로그인이 필요합니다." });
  }

  let users = await loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res
      .status(404)
      .json({ success: false, message: "사용자를 찾을 수 없습니다." });
  }

  // 동일한 날짜와 시간에 이미 예약된 영화가 있는지 확인
  const existingReservation = users[userIndex].reservations.find(
    (reservation) => {
      return (
        reservation.viewdate === viewdate && reservation.viewtime === viewtime
      );
    }
  );

  if (existingReservation && !forceReservation) {
    return res.status(400).json({
      success: false,
      message:
        "같은 시간에 예약된 영화가 있습니다. 그래도 예매를 진행하시겠습니까?",
      conflict: true,
    });
  }

  const newReservation = {
    movieTitle,
    director,
    cast,
    summary,
    date: new Date().toISOString(),
    viewdate,
    viewtime,
  };
  users[userIndex].reservations.push(newReservation);
  await saveUsers(users);

  res.json({
    success: true,
    message: "예매가 완료되었습니다.",
    reservation: newReservation,
  });
};

const getReservations = async (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "로그인이 필요합니다." });
  }

  const users = await loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "사용자를 찾을 수 없습니다." });
  }

  res.json({ success: true, reservations: user.reservations });
};

const cancelReservation = async (req, res) => {
  const { userId } = req.session;
  const { reservationId } = req.body;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "로그인이 필요합니다." });
  }

  let users = await loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res
      .status(404)
      .json({ success: false, message: "사용자를 찾을 수 없습니다." });
  }

  users[userIndex].reservations.splice(reservationId, 1);
  await saveUsers(users);

  res.json({ success: true, message: "예매가 취소되었습니다." });
};

const cancelAllReservations = async (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "로그인이 필요합니다." });
  }

  let users = await loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res
      .status(404)
      .json({ success: false, message: "사용자를 찾을 수 없습니다." });
  }

  users[userIndex].reservations = [];
  await saveUsers(users);

  res.json({ success: true, message: "모든 예매가 취소되었습니다." });
};

module.exports = {
  register,
  login,
  logout,
  isAuthenticated,
  addReservation,
  getReservations,
  cancelReservation,
  cancelAllReservations,
};