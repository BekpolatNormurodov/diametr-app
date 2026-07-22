
import khurshidImg from "../../../assets/khurshid.png"
import rahmatjonImg from "../../../assets/rahmatjon.png"
import alisherImg from "../../../assets/alisher.png"
import muhammadumarImg from "../../../assets/muhammadumar.png"

import muhammadjonImg from "../../../assets/muhammadjon.png"
import husniddinImg from "../../../assets/husniddin.png"
import sardorImg from "../../../assets/sardor.png"

export default function Team() {
    const users = [
        {
            "image": sardorImg,
            "name": "Сардор Туропов",
            "role": "Директор",
            "instagram": "https://www.instagram.com/sardor_chik18/",
        },
        {
            "image": khurshidImg,
            "name": "Хуршид Исмоилов",
            "role": "Руководитель группы",
            "linkiden": "https://www.linkedin.com/in/khurshid-ismoilov-11542a22b/",
            "instagram": "https://www.instagram.com/khurshid_ismoilov28/",
        },
        {
            "image": alisherImg,
            "name": "Алишер Баходиров",
            "role": "Мобильный разработчик",
            "linkiden": "https://uz.linkedin.com/in/albahodirov",
            "instagram": "https://www.instagram.com/albahodirov/",
        },
        {
            "image": rahmatjonImg,
            "name": "Рахматжон Хамидов",
            "role": "Бэкэнд-разработчик",
            "linkiden": "https://www.linkedin.com/in/raxmatjon-hamidov/",
            "instagram": "https://www.instagram.com/raxmatjon_77_15/",

        },

        {
            "image": husniddinImg,
            "name": "Хусниддин Хожанходжаев",
            "role": "Менеджер по продажам",
            // "linkiden": "https://www.linkedin.com/in/raxmatjon-hamidov/",
            // "instagram": "https://www.instagram.com/raxmatjon_77_15/",
        },
        {
            "image": muhammadumarImg,
            "name": "МухаммадУмар Давлатов",
            "role": "Мобильный разработчик",
            "linkiden": "https://www.linkedin.com/in/muhammadumar-davlatov-12a29a218/",
            "instagram": "https://www.instagram.com/muhammadumar_prog/",
        },
        {
            "image": muhammadjonImg,
            "name": "Мухаммадджон Муродуллаев",
            "role": "Веб-разработчик",
            "linkiden": "https://www.linkedin.com/in/muhammadjon-murodullayev-3859b12b2/",
            "instagram": "https://www.instagram.com/m_uhammadjon_21",
        },



    ]
    return (
        <div id="Team" className='Team w-full px-4 md:px-5 py-20 min-h-[500px]  flex flex-col items-center space-y-1 text-center'>

            <span className='text-primary bg-secondary rounded-full px-4 py-2 '>Команда</span>
            <p className='font-semibold md:md:text-[36px] text-[24px] text-[18px]  text-textColor max-w-[1200px]'>
                Знакомство с героями
            </p>

            <p className='md:text-[18px] text-[16px] text-textColor max-w-[600px] '>
                Ответственная команда с большим потенциалом, глубокими знаниями и острым умом. Мы предлагаем свои знания и умения.
            </p>
            <div className='h-[40px]'></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 md:grid-cols-3 w-full gap-[16px] md:gap-[24px]  text-left max-w-[1200px]">



                {
                    users.map((e, index) => {
                        return <div key={`user-${e.name}-${index}`} className="max-w-[280px] bg-secondary rounded-[36px] p-[16px] md:p-[24px] min-h-[240px] flex flex-col items-center text-center">
                            <img src={e.image} alt="" className="rounded-full w-[80px] h-[80px]" />
                            <span className="text-black font-medium text-[18px] mt-5">{e.name}</span>
                            <span className="text-textColor text-[18px] mb-5">{e.role}</span>
                            {/* <span className="text-textGrey text-[16px] mb-5">Обладатель высокого энтузиазма и острого ума</span> */}
                            <div className="flex flex-row gap-3 justify-center items-center	h-[24px]">
                                <svg onClick={() => window.open(e.instagram?.toString())} width="20" height="20" viewBox="0 0 20 20" fill="#98A2B3" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer w-[20px] h-[20px] scale-125	">
                                    <path d="M13.498 6.651a1.656 1.656 0 0 0-.95-.949 2.766 2.766 0 0 0-.928-.172c-.527-.024-.685-.03-2.02-.03s-1.493.006-2.02.03a2.766 2.766 0 0 0-.929.172 1.656 1.656 0 0 0-.949.95 2.766 2.766 0 0 0-.172.928c-.024.527-.03.685-.03 2.02s.006 1.493.03 2.02a2.766 2.766 0 0 0 .172.929 1.656 1.656 0 0 0 .95.949 2.766 2.766 0 0 0 .928.172c.527.024.685.03 2.02.03s1.493-.006 2.02-.03a2.766 2.766 0 0 0 .929-.172 1.656 1.656 0 0 0 .949-.95 2.766 2.766 0 0 0 .172-.928c.024-.527.03-.685.03-2.02s-.006-1.493-.03-2.02a2.766 2.766 0 0 0-.172-.929zM9.6 12.168A2.568 2.568 0 1 1 12.168 9.6 2.568 2.568 0 0 1 9.6 12.168zm2.669-4.637a.6.6 0 1 1 .6-.6.6.6 0 0 1-.6.6z"></path><circle cx="9.6" cy="9.6" r="1.667"></circle><path d="M9.6 0a9.6 9.6 0 1 0 9.6 9.6A9.6 9.6 0 0 0 9.6 0zm4.97 11.662a3.67 3.67 0 0 1-.233 1.213 2.556 2.556 0 0 1-1.462 1.462 3.67 3.67 0 0 1-1.213.233c-.534.024-.704.03-2.062.03s-1.528-.006-2.062-.03a3.67 3.67 0 0 1-1.213-.233 2.556 2.556 0 0 1-1.462-1.462 3.67 3.67 0 0 1-.233-1.213c-.024-.534-.03-.704-.03-2.062s.006-1.528.03-2.062a3.67 3.67 0 0 1 .233-1.213 2.556 2.556 0 0 1 1.462-1.462 3.67 3.67 0 0 1 1.213-.233c.534-.024.704-.03 2.062-.03s1.528.006 2.062.03a3.67 3.67 0 0 1 1.213.233 2.556 2.556 0 0 1 1.462 1.462 3.67 3.67 0 0 1 .233 1.213c.024.534.03.704.03 2.062s-.006 1.528-.03 2.062z"></path>

                                </svg>



                                <svg onClick={() => window.open(e.linkiden?.toString())} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer">
                                    <g clip-path="url(#clip0_619_30319)">
                                        <path d="M18.5195 0H1.47656C0.660156 0 0 0.644531 0 1.44141V18.5547C0 19.3516 0.660156 20 1.47656 20H18.5195C19.3359 20 20 19.3516 20 18.5586V1.44141C20 0.644531 19.3359 0 18.5195 0ZM5.93359 17.043H2.96484V7.49609H5.93359V17.043ZM4.44922 6.19531C3.49609 6.19531 2.72656 5.42578 2.72656 4.47656C2.72656 3.52734 3.49609 2.75781 4.44922 2.75781C5.39844 2.75781 6.16797 3.52734 6.16797 4.47656C6.16797 5.42188 5.39844 6.19531 4.44922 6.19531ZM17.043 17.043H14.0781V12.4023C14.0781 11.2969 14.0586 9.87109 12.5352 9.87109C10.9922 9.87109 10.7578 11.0781 10.7578 12.3242V17.043H7.79688V7.49609H10.6406V8.80078H10.6797C11.0742 8.05078 12.043 7.25781 13.4844 7.25781C16.4883 7.25781 17.043 9.23438 17.043 11.8047V17.043Z" fill="#98A2B3" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_619_30319">
                                            <rect width="20" height="20" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>


                        </div>
                    })
                }
            </div>










        </div>
    )
}
