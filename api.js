let container = document.getElementById('container') // 소를 담을 컨데이너 생성


fetch(url)
  .then(response => response.json())
  .then(function (item) { 
    for (let i = 0; i < 20; i++) {
      // div 생성 
      let div = document.createElement('div'); 
      div.id = 'movies'

      // api를 리스트에 담기
      let search_movie_list = item.boxOfficeResult.weeklyBoxOfficeList[i]

      // 요소 생성
      let movieNm = document.createElement('p')
      let openDt = document.createElement('p')
      let rank = document.createElement('p')

      movieNm.innerText = search_movie_list.movieNm // 영화이름
      openDt.innerText = search_movie_list.openDt // 개봉날짜
      rank.innerText = search_movie_list.rank //순위
      audiCnt.innerText=search_movie_list.audiCnt //누적관객수
      


      // html에 요소 담기
      div.appendChild(movieNm);
      div.appendChild(openDt);
      div.appendChild(rank);
      div.appendChild(audiCnt);
      container.appendChild(div);
    }

  });