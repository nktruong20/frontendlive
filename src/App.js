import React, { useState, useRef } from 'react';
import axios from 'axios';

const bgmList = ['/assets/bgm.mp3'];

function App() {
  const [story, setStory] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [bgmSrc, setBgmSrc] = useState(bgmList[0]);
  const [bgmVolume, setBgmVolume] = useState(0.15);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [nextStory, setNextStory] = useState(null);
  const [nextAudioUrl, setNextAudioUrl] = useState(null);

  const audioRef = useRef(null);
  const bgmRef = useRef(null);
  const isPreloadingRef = useRef(false);

  const getAndPlayStory = async () => {
    setLoading(true);
    setStory('');
    setAudioUrl('');

    const random = bgmList[Math.floor(Math.random() * bgmList.length)];
    setBgmSrc(random);

    try {
      const res = await axios.get('http://localhost:5000/api/story');
      setStory(res.data.content);
      const url = 'http://localhost:5000' + res.data.audioUrl + `?t=${Date.now()}`;
      setAudioUrl(url);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play();
        }
        if (bgmRef.current && bgmRef.current.paused) {
          bgmRef.current.src = random;
          bgmRef.current.volume = bgmVolume;
          bgmRef.current.currentTime = 0;
          bgmRef.current.play();
        }
      }, 300);
    } catch (err) {
      setStory('❌ Không thể lấy truyện mới.');
    }

    setLoading(false);
  };

  const preloadNextStory = async () => {
    if (isPreloadingRef.current || nextStory) return;
    isPreloadingRef.current = true;
    try {
      const res = await axios.get('http://localhost:5000/api/story');
      setNextStory(res.data.content);
      setNextAudioUrl('http://localhost:5000' + res.data.audioUrl + `?t=${Date.now()}`);
    } catch (err) {
      console.error('❌ Lỗi preload truyện:', err.message);
    }
    isPreloadingRef.current = false;
  };

  const handleAudioEnd = () => {
    if (!isLooping) return;

    if (nextStory && nextAudioUrl) {
      setStory(nextStory);
      setAudioUrl(nextAudioUrl);
      setNextStory(null);
      setNextAudioUrl(null);
      isPreloadingRef.current = false;

      const nextBgm = bgmList[Math.floor(Math.random() * bgmList.length)];
      setBgmSrc(nextBgm);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play();
        }
        if (bgmRef.current && bgmRef.current.paused) {
          bgmRef.current.src = nextBgm;
          bgmRef.current.volume = bgmVolume;
          bgmRef.current.currentTime = 0;
          bgmRef.current.play();
        }
      }, 2000); // Delay 2 giây
    } else {
      getAndPlayStory();
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const remaining = audio.duration - audio.currentTime;
    if (remaining < 20 && !isPreloadingRef.current && !nextStory) {
      preloadNextStory();
    }
  };

  return (
    <div style={{
      padding: 30,
      fontFamily: 'Segoe UI',
      backgroundColor: '#f7f8fa',
      color: '#333',
      maxWidth: 800,
      margin: '0 auto',
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>📚 Kể Chuyện Tự Động 🎧</h1>

      {/* Audio kể chuyện */}
      <audio
        ref={audioRef}
        controls
        onEnded={handleAudioEnd}
        onTimeUpdate={handleTimeUpdate}
        style={{ marginBottom: 20, width: '100%' }}
      >
        <source src={audioUrl} type="audio/mpeg" />
        Trình duyệt không hỗ trợ audio.
      </audio>

      {/* Nhạc nền ẩn */}
      <audio
        ref={bgmRef}
        loop
        muted={isMuted}
        style={{ display: 'none' }}
      >
        <source src={bgmSrc} type="audio/mpeg" />
      </audio>

      {/* Nút điều khiển */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 15 }}>
        <button
          onClick={() => {
            setIsLooping(!isLooping);
            if (!isLooping) getAndPlayStory();
            else {
              setNextStory(null);
              setNextAudioUrl(null);
              isPreloadingRef.current = false;
            }
          }}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: isLooping ? '#ff4d4f' : '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          {isLooping ? '⛔ Dừng kể chuyện' : '▶️ Bắt đầu kể chuyện'}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          {isMuted ? '🔈 Bật nhạc nền' : '🔇 Tắt nhạc nền'}
        </button>
      </div>

      {/* Âm lượng nhạc nền */}
      <div style={{ marginTop: 20 }}>
        <label>🎚️ Âm lượng nhạc nền:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={bgmVolume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setBgmVolume(v);
            if (bgmRef.current) bgmRef.current.volume = v;
          }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Trạng thái tạo truyện */}
      {loading && <p style={{ marginTop: 20 }}>⏳ Đang tạo truyện...</p>}

      {/* Nội dung truyện */}
      {story && (
        <div style={{
          marginTop: 30,
          whiteSpace: 'pre-wrap',
          background: '#fff',
          padding: 20,
          borderRadius: 10,
          lineHeight: 1.6
        }}>
          <h2>📖 Nội dung truyện:</h2>
          <p>{story}</p>
        </div>
      )}

      {/* CSS nội bộ */}
      <style>{`
        button:hover {
          opacity: 0.9;
          transform: scale(1.02);
          transition: all 0.2s ease;
        }

        input[type="range"] {
          accent-color: #1890ff;
        }

        h1 {
          color: #2c3e50;
        }

        h2 {
          color: #34495e;
        }

        audio::-webkit-media-controls-panel {
          background-color: #f0f2f5;
        }
      `}</style>
    </div>
  );
}

export default App;
