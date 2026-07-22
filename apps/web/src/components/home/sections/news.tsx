import React, { useEffect, useRef, useState } from "react";

import bg_mask from "../../../assets/bg.png"

export default function News(): JSX.Element {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
      title: "Yuqori sifatli qurilish materiallari",
      description: "Barcha turdagi qurilish ishlari uchun professional materiallar. Sement, g'isht, beton va boshqalar."
    },
    {
      image: "https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=800&q=80",
      title: "Tezkor yetkazib berish xizmati",
      description: "Buyurtmalaringizni tez va xavfsiz yetkazib beramiz. Toshkent va viloyatlarga xizmat ko'rsatamiz."
    },
    {
      image: "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800&q=80",
      title: "Hamyonbop narxlar",
      description: "Eng yaxshi narxlar va maxsus chegirmalar. Ulgurji va chakana savdo. Professional maslahat bepul."
    }
  ];

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const autoScroll = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % slides.length;
        const scrollAmount = carousel.clientWidth * newIndex;
        carousel.scrollTo({
          left: scrollAmount,
          behavior: 'smooth'
        });
        return newIndex;
      });
    }, 4000); // 4 soniyada bir o'zgaradi

    return () => clearInterval(autoScroll);
  }, [slides.length]);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20 min-h-[400px] flex flex-col items-center space-y-4 md:space-y-6 text-center bg-gradient-to-br from-white to-secondary/30">

      <p className='font-semibold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-textColor max-w-[900px] px-4'>
        Maxsus takliflar
      </p>
      <p className='text-base md:text-lg text-primary max-w-[700px] px-4 pb-4 md:pb-6'>
        Siz uchun eng yaxshi narxlar va sifatli qurilish materiallari
      </p>

      <div className="flex flex-col lg:flex-row items-center w-full h-full gap-6 md:gap-8 lg:gap-12 max-w-[1400px]">
        <div className="w-full lg:w-1/2 h-full">
        <div ref={carouselRef} className="carousel rounded-2xl w-full max-w-[600px] mx-auto h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] shadow-xl overflow-hidden">
        {slides.map((slide, index) => (
          <div key={index} className="carousel-item w-full relative">
            <img
              src={slide.image}
              className="h-full w-full object-cover"
              alt={slide.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-left text-white">
                <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                <p className="text-sm opacity-90">{slide.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

        </div>
        <div className="w-full lg:w-1/2 max-w-[700px] min-h-[300px] md:min-h-[350px] lg:min-h-[400px] flex flex-col items-start justify-center bg-no-repeat bg-center p-4 sm:p-6 md:p-8 animate-fadeInUp" style={{
          backgroundImage: `url(${bg_mask})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }}>
       <div className="text-left space-y-3 md:space-y-4">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-textColor mb-2 md:mb-4">{slides[currentIndex].title}</h3>
        <p className="text-sm sm:text-base md:text-lg text-textColor opacity-90 leading-relaxed mb-4 md:mb-6">
          {slides[currentIndex].description}
        </p>
        <ul className="list-none text-textColor space-y-2 md:space-y-3">
          <li className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
            <span>Keng assortiment</span>
          </li>
          <li className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
            <span>Tezkor yetkazib berish</span>
          </li>
          <li className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
            <span>Professional maslahat</span>
          </li>
          <li className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
            <span>Hamyonbop narxlar</span>
          </li>
        </ul>
        <div className="flex gap-2 mt-4 md:mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                if (carouselRef.current) {
                  const scrollAmount = carouselRef.current.clientWidth * index;
                  carouselRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                }
              }}
              className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
                currentIndex === index ? 'bg-primary w-6 md:w-8' : 'bg-gray-300 w-2 md:w-3'
              }`}
            />
          ))}
        </div>
       </div>
        </div>

      </div>
    </div>
  );
}