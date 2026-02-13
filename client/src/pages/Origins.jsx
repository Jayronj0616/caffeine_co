const Origins = () => {
    return (
        <div className="pt-32 pb-20 px-8 max-w-5xl mx-auto text-center min-h-screen animate-fade-in-up">
            <h1 className="text-5xl font-serif text-espresso mb-8">Our Origins</h1>
            <p className="text-lg text-bean max-w-3xl mx-auto leading-relaxed">
                We travel to the farthest corners of the globe to source the finest beans. From the misty highlands of Ethiopia to the sun-drenched plantations of Colombia, every bean tells a story of dedication, tradition, and artistry.
            </p>
             <div className="mt-12 p-12 bg-oatmeal/20 rounded-lg shadow-inner">
                <p className="italic text-espresso text-2xl font-serif">"Coffee is not just a drink; it's a journey."</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 mt-16 text-left">
                <div className="bg-milk p-8 rounded-lg shadow-sm border border-oatmeal">
                    <h3 className="text-2xl font-serif mb-4 text-espresso">Ethiopia</h3>
                    <p className="text-bean">Known as the birthplace of coffee, Ethiopia offers complex, fruity, and floral notes that are impossible to replicate.</p>
                </div>
                <div className="bg-milk p-8 rounded-lg shadow-sm border border-oatmeal">
                    <h3 className="text-2xl font-serif mb-4 text-espresso">Colombia</h3>
                    <p className="text-bean">Our Colombian partners provide the rich, nutty, and chocolatey profiles that form the backbone of our signature espresso blend.</p>
                </div>
            </div>
        </div>
    );
};
export default Origins;
