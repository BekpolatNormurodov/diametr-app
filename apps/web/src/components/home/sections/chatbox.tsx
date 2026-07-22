import React, { useState } from 'react'



export default function Chatbox() {
    const [showed, setshowed] = useState(true)


    return (
        <div>

            <div className={`w-72 h-80 sm:w-80 sm:h-96 md:w-96 md:h-[450px] flex-col border shadow-lg bg-white rounded-2xl md:rounded-3xl transition-all ease-in-out delay-300 ` +(showed ? "flex" :"hidden")}>
                <div className="flex items-center justify-between border-b p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <img className="rounded-full w-10 h-10 md:w-12 md:h-12 flex-shrink-0"
                            src="https://img.freepik.com/premium-vector/robot-icon-bot-sign-design-chatbot-symbol-concept-voice-support-service-bot-online-support-bot-vector-stock-illustration_100456-34.jpg" />
                        <div>
                            <div className="font-semibold text-sm md:text-base">
                                <span>Support bot</span>
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">Online</div>
                        </div>
                    </div>

                    <div>


                        <button className="inline-flex hover:bg-indigo-50 rounded-full p-2 min-w-[44px] min-h-[44px] items-center justify-center" type="button" onClick={()=>setshowed(false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                </div>

                <div className="flex-1 px-3 md:px-4 py-3 md:py-4 overflow-y-auto">


                    <div className="flex items-start mb-4">
                        <div className="flex-none flex flex-col items-center space-y-1 mr-2 md:mr-3">
                            <img className="rounded-full w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                                src="https://img.freepik.com/premium-vector/robot-icon-bot-sign-design-chatbot-symbol-concept-voice-support-service-bot-online-support-bot-vector-stock-illustration_100456-34.jpg" />
                            <span className="text-xs hover:underline">Support bot</span>
                        </div>
                        <div className="flex-1 bg-indigo-400 text-white p-2 md:p-3 rounded-lg mb-2 relative text-sm md:text-base">
                            <div>Sizga qanday yordam bera olaman?</div>

                            <div className="absolute left-0 top-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-indigo-400"></div>
                        </div>
                    </div>



                    <div className="flex items-start flex-row-reverse mb-4">
                        <div className="flex-none flex flex-col items-center space-y-1 ml-2 md:ml-3">
                            <img className="rounded-full w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                                src="https://cdn-icons-png.flaticon.com/512/3364/3364044.png" />
                            <span className="text-xs hover:underline">Siz</span>
                        </div>
                        <div className="flex-1 bg-indigo-100 text-gray-800 p-2 md:p-3 rounded-lg mb-2 relative text-sm md:text-base">
                            <div>Ofislaringiz qayerda joylashgan?</div>

                            <div className="absolute right-0 top-1/2 transform translate-x-1/2 rotate-45 w-2 h-2 bg-indigo-100"></div>
                        </div>
                    </div>



                    <div className="flex items-start mb-4">
                        <div className="flex-none flex flex-col items-center space-y-1 mr-2 md:mr-3">
                            <img className="rounded-full w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                                src="https://img.freepik.com/premium-vector/robot-icon-bot-sign-design-chatbot-symbol-concept-voice-support-service-bot-online-support-bot-vector-stock-illustration_100456-34.jpg" />
                            <span className="text-xs hover:underline">Support bot</span>
                        </div>
                        <div className="flex-1 bg-indigo-400 text-white p-2 md:p-3 rounded-lg mb-2 relative text-sm md:text-base">
                            <div>Toshkent shahar , shayxontoxur tumani nurafshon kochasi 1 uy</div>

                            <div className="absolute left-0 top-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-indigo-400"></div>
                        </div>
                    </div>

                </div>

                <div className="flex items-center border-t p-2 md:p-3 bg-white">


                    <div className="w-full mx-2 bg-white">
                        <input className="w-full rounded-full border border-gray-200 bg-white px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base min-h-[40px]" type="text" placeholder="Xabar yozing" />
                    </div>


                    <div>
                        <button className="inline-flex hover:bg-indigo-50 rounded-full p-2 min-w-[44px] min-h-[44px] items-center justify-center" type="button">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
