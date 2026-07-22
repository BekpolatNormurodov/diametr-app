
import checkSvg from "../../../assets/check.svg"


export default function FuncSection() {
    return (
        <div className='Func w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20 min-h-[400px] flex flex-col items-center space-y-4 md:space-y-6 text-center'>


            <p className='font-semibold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-textColor max-w-[900px] px-4'>
                Diametr bilan xaridlaringizni osonlashtiring: Hoziroq boshlang
            </p>

            <p className='text-base md:text-lg text-textColor max-w-[700px] px-4 opacity-90'>
                Biz doim sizga g'amxo'rlik qilamiz
            </p>
            <div className='h-6 md:h-10'></div>
            <div className='flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-6 lg:gap-10 w-full max-w-[1000px]'>
                <div className='gap-2 md:gap-3 flex flex-row items-center hover-lift p-3 md:p-4 rounded-xl hover:bg-secondary/30 transition-all duration-300 w-full md:w-auto justify-center md:justify-start'>
                    <div className='bg-gradient-to-br from-primary to-primary/70 flex flex-row justify-center items-center rounded-full w-[40px] h-[40px] md:w-[45px] md:h-[45px] shadow-md flex-shrink-0'>
                        <img src={checkSvg} alt="" className='w-[20px] h-[20px] md:w-[24px] md:h-[24px]'/>
                    </div>
                    <span className='font-medium text-base md:text-lg text-textColor'>Yuqori limit</span>
                </div>


                <div className='gap-2 md:gap-3 flex flex-row items-center hover-lift p-3 md:p-4 rounded-xl hover:bg-secondary/30 transition-all duration-300 w-full md:w-auto justify-center md:justify-start'>
                    <div className='bg-gradient-to-br from-primary to-primary/70 flex flex-row justify-center items-center rounded-full w-[40px] h-[40px] md:w-[45px] md:h-[45px] shadow-md flex-shrink-0'>
                        <img src={checkSvg} alt="" className='w-[20px] h-[20px] md:w-[24px] md:h-[24px]'/>
                    </div>
                    <span className='font-medium text-base md:text-lg text-textColor'>Tezkor rasmiylashtiruv</span>
                </div>


                <div className='gap-2 md:gap-3 flex flex-row items-center hover-lift p-3 md:p-4 rounded-xl hover:bg-secondary/30 transition-all duration-300 w-full md:w-auto justify-center md:justify-start'>
                    <div className='bg-gradient-to-br from-primary to-primary/70 flex flex-row justify-center items-center rounded-full w-[40px] h-[40px] md:w-[45px] md:h-[45px] shadow-md flex-shrink-0'>
                        <img src={checkSvg} alt="" className='w-[20px] h-[20px] md:w-[24px] md:h-[24px]'/>
                    </div>
                    <span className='font-medium text-base md:text-lg text-textColor'>12 oylik muddat</span>
                </div>
            </div>

            <div className='h-6 md:h-10'></div>
            <button className="btn bg-gradient-to-r from-primary to-primary/80 text-white text-sm md:text-base border-none hover:text-white hover:from-primary/90 hover:to-primary/70 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 min-h-[44px] px-8 md:px-10 font-semibold rounded-xl">Yuklab olish</button>

        </div>
    )
}
