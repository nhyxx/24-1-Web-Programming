const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require('fs');
const multer = require("multer");
const morgan = require("morgan");
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
      const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
      cb(null, Date.now() + '-' + sanitizedFilename);
  }
});

const upload = multer({ storage: storage });

const {
  register,
  login,
  logout,
  isAuthenticated,
  addReservation,
  getReservations,
  cancelReservation,
  cancelAllReservations,
} = require("./login");
const { searchMoviesByTitle, searchMoviesByDirector, searchMoviesByActor } = require("./movies");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 세션 설정
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log("New request:", new Date().toLocaleTimeString());
  next();
});

// 로그인 페이지로 이동
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);

// 메인 페이지에 접근하기 위해서는 인증이 필요함
app.get("/main", isAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "main.html"))
);

// 회원가입, 로그인, 로그아웃 엔드포인트
app.post("/register", register);
app.post("/login", login);
app.post("/logout", logout);

// 영화 정보 조회
app.post('/info', (req, res) => {
  console.log("Request body:", req.body); // 요청 바디 확인
  let movieTitle = req.body.movieTitle;
  let movieDirector = req.body.director;
  let movieCast = req.body.cast;
  let movieSummary = req.body.summary;

  // 요청 받은 데이터를 확인하기 위해 서버 콘솔에 출력
  console.log("영화 제목:", movieTitle);
  console.log("감독:", movieDirector);
  console.log("출연:", movieCast);
  console.log("줄거리:", movieSummary);

  // 클라이언트에 응답 요청
  res.send({ movieTitle, movieDirector, movieCast, movieSummary });
});


// 예매 관련 엔드포인트
app.post("/reserve", isAuthenticated, (req, res) => {
  console.log("Received reservation data:", req.body);  
  addReservation(req, res);
});
app.get("/reservations", isAuthenticated, getReservations);
app.post("/cancel-reservation", isAuthenticated, cancelReservation);
app.post("/cancel-all-reservations", isAuthenticated, cancelAllReservations);

// 영화 검색
app.get("/search", async (req, res) => {
  const { title, director, actor } = req.query;

  try {
    let results = [];
    if (title) {
      results = await searchMoviesByTitle(title);
    } else if (director) {
      results = await searchMoviesByDirector(director);
    } else if (actor) {
      results = await searchMoviesByActor(actor);
    }
    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});

app.get("/movie-times", (req, res) => {
  const { date } = req.query;
  const times = ["10:00 AM", "01:00 PM", "04:00 PM", "07:00 PM", "10:00 PM"];
  res.json({ success: true, times });
});

// JSON 파일을 읽는 함수
const readData = () => {
  const data = fs.readFileSync(path.join(__dirname, 'reviews.json'), 'utf8');
  return JSON.parse(data);
};

// JSON 파일을 쓰는 함수
const writeData = (data) => {
  fs.writeFileSync(path.join(__dirname, 'reviews.json'), JSON.stringify(data, null, 2), 'utf8');
};

// JSON 파일 라우트
app.get('/reviews.json', (req, res) => {
  const data = readData();
  res.json(data);
  console.log('reviews.json file served');
});

// 감상평 저장 엔드포인트
app.post('/saveReview', upload.single('file'), (req, res) => {
  const { title, content } = req.body;
  const file = req.file;
  const userId = req.session.userId; // 세션에서 사용자 ID를 가져옴

  let data = readData();
  let movie = data.find(movie => movie.title === title);
  
  if (movie) {
      const review = {
          id: uuidv4(),
          content,
          file: file ? file.filename : null,
          userId // 리뷰 작성자 ID 저장
      };
      movie.review.push(review);
      writeData(data);
      res.send({ message: 'Review saved successfully!' });
  } else {
      res.status(404).send({ message: 'Movie not found' });
  }
});
app.post('/updateReview', upload.single('file'), (req, res) => {
  const { title, content, reviewId } = req.body;
  const file = req.file;
  const userId = req.session.userId; // 세션에서 사용자 ID를 가져옴

  let data = readData();
  let movie = data.find(movie => movie.title === title);

  if (movie) {
      let review = movie.review.find(review => review.id === reviewId);
      if (review) {
          if (review.userId === userId) { // 사용자 검증
              review.content = content;
              if (file) {
                  // 기존 파일 삭제
                  if (review.file) {
                      const filePath = path.join(__dirname, 'uploads', review.file);
                      if (fs.existsSync(filePath)) {
                          fs.unlinkSync(filePath);
                          console.log(`Deleted file: ${filePath}`);
                      }
                  }
                  review.file = file.filename;
              }
              writeData(data);
              res.send({ message: 'Review updated successfully!' });
          } else {
              res.status(403).send({ message: 'Unauthorized to edit this review' });
          }
      } else {
          res.status(404).send({ message: 'Review not found' });
      }
  } else {
      res.status(404).send({ message: 'Movie not found' });
  }
});


// 작성자 검증 엔드포인트
app.get('/verifyReviewAuthor', (req, res) => {
  const { reviewId } = req.query;
  const userId = req.session.userId;

  let data = readData();
  let isAuthor = false;

  data.forEach(movie => {
      let review = movie.review.find(review => review.id === reviewId);
      if (review && review.userId === userId) {
          isAuthor = true;
      }
  });

  res.send({ isAuthor });
});

// 감상평 불러오기 엔드포인트
app.get('/reviews', (req, res) => {
  const { title } = req.query;
  let data = readData();
  let movie = data.find(movie => movie.title === title);
  
  if (movie) {
      res.send(movie.review);
  } else {
      res.status(404).send({ message: 'Movie not found' });
  }
});

// 개별 감상평 삭제 엔드포인트
app.delete('/review', (req, res) => {
  const { title, reviewId } = req.query;
  const userId = req.session.userId; // 세션에서 사용자 ID를 가져옴

  let data = readData();
  let movie = data.find(movie => movie.title === title);

  if (movie) {
    const reviewIndex = movie.review.findIndex(review => review.id === reviewId);
    if (reviewIndex !== -1) {
      const review = movie.review[reviewIndex];
      if (review.userId === userId) { // 사용자 검증
        if (review.file) {
          const filePath = path.join(__dirname, 'uploads', review.file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          }
        }
        movie.review.splice(reviewIndex, 1);
        writeData(data);
        console.log(`Review with ID ${reviewId} deleted`);
        res.send({ message: 'Review deleted successfully!' });
      } else {
        res.status(403).send({ message: 'Unauthorized to delete this review' });
      }
    } else {
      res.status(404).send({ message: 'Review not found' });
    }
  } else {
    res.status(404).send({ message: 'Movie not found' });
  }
});


// 감상평 전체 삭제 엔드포인트
app.delete('/reviews', (req, res) => {
  const { title } = req.query;
  const userId = req.session.userId; // 세션에서 사용자 ID를 가져옴

  let data = readData();
  let movie = data.find(movie => movie.title === title);

  if (movie) {
    // 모든 리뷰에 대해 작성자 권한을 확인
    let unauthorized = false;
    movie.review.forEach(review => {
      if (review.userId !== userId) {
        unauthorized = true;
      }
    });

    if (unauthorized) {
      res.status(403).send({ message: 'Unauthorized to delete all reviews' });
    } else {
      // 리뷰에 첨부된 모든 파일 삭제
      movie.review.forEach(review => {
        if (review.file) {
          const filePath = path.join(__dirname, 'uploads', review.file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          }
        }
      });

      // 리뷰 목록 비우기
      movie.review = [];
      writeData(data);
      console.log(`All reviews for ${title} deleted`);
      res.send({ message: 'All reviews deleted successfully!' });
    }
  } else {
    res.status(404).send({ message: 'Movie not found' });
  }
});

// 404 에러 처리
app.use((req, res, next) => {
  res.status(404).send("<h1>Sorry, Page Not Found</h1>");
  console.log("404 Error sent");
});

// 서버 실행
app.listen(3000, () => {
  console.log("Server running at port: 3000!");
});