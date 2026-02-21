"use client";

export default function CuttingListPage() {
  return (
    <div className="space-y-8">
      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wardrobe Card */}
        <a href="/dashboard/cutting-list/wardrobe" className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-blue-300 cursor-pointer">
          <div className="flex items-center justify-center mb-4">
            {/* 3D Wardrobe */}
            <div className="relative">
              {/* Main cabinet body */}
              <div 
                className="relative w-24 h-24 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-lg shadow-xl border-2 border-blue-300 group-hover:scale-105 transition-transform duration-300"
                style={{
                  transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                  boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3), 8px 8px 0 rgba(59, 130, 246, 0.1)'
                }}
              >
                <div className="absolute inset-2 border border-blue-200/50 rounded"></div>
                <div className="absolute top-2 left-2 right-2 h-5 bg-blue-300/40 rounded flex items-center justify-center">
                  <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 h-5 bg-blue-300/40 rounded flex items-center justify-center">
                  <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
                </div>
              </div>
              {/* Depth shadow effect */}
              <div 
                className="absolute w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg opacity-30"
                style={{
                  top: '8px',
                  left: '8px',
                  transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                  zIndex: -1
                }}
              ></div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 text-center">Wardrobe</h3>
        </a>

        {/* Kitchen Card */}
        <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-orange-300">
          <div className="flex items-center justify-center mb-4">
            {/* 3D Kitchen */}
            <div className="relative">
              {/* Main cabinet body */}
              <div 
                className="relative w-24 h-24 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-lg shadow-xl border-2 border-orange-300 group-hover:scale-105 transition-transform duration-300"
                style={{
                  transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                  boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3), 8px 8px 0 rgba(249, 115, 22, 0.1)'
                }}
              >
                <div className="absolute inset-2 border border-orange-200/50 rounded"></div>
                <div className="absolute top-2 left-2 w-4 h-4 bg-orange-300/50 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-orange-200 rounded-full"></div>
                </div>
                <div className="absolute top-2 right-2 w-4 h-4 bg-orange-300/50 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-orange-200 rounded-full"></div>
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-2 bg-orange-300/50 rounded"></div>
              </div>
              {/* Depth shadow effect */}
              <div 
                className="absolute w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg opacity-30"
                style={{
                  top: '8px',
                  left: '8px',
                  transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                  zIndex: -1
                }}
              ></div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 text-center">Kitchen</h3>
        </div>
      </div>
    </div>
  );
}

