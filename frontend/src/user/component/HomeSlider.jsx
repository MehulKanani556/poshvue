import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";

import "swiper/css";
import "swiper/css/navigation";

export default function HomeSlider() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/catalog/categories"
      );

      // ⚠️ Your backend returns "items"
      setCategories(res.data.items || []);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  if (!categories.length) return null;

  return (
    <>
      <section className="z_slide_section">
        <div className="container">
          <Swiper
            modules={[Autoplay]}
            loop={true}
            speed={3000}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
            }}
            slidesPerView={5}
            spaceBetween={20}
            navigation
            breakpoints={{
              0: { slidesPerView: 2 },
              425: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1440: { slidesPerView: 7 },

            }}
          >
            {categories.map((item) => (
              <SwiperSlide key={item._id}>
                <div 
                  className="z_slide_item" 
                  onClick={() => navigate(`/ShopPage?style=${encodeURIComponent(item.name)}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="z_slide_img_wrap">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <p className="z_slide_title">{item.name}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    </>
  );
}
