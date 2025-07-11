"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Sparkles,
    Users,
    ChevronRight,
    Video,
    Calendar,
    MessageSquare,
    FileText,
    Bell,
    Zap,
    Shield,
    BarChart3,
    Mic,
    Share2,
} from "lucide-react"

export default function MeetingsPage() {
    const authContext = useAuth()

    // Get theme colors based on user role
    const getThemeColor = () => {
        switch (authContext.user?.role) {
            case "admin":
                return {
                    primary: "from-orange-500 to-orange-600",
                    primaryHover: "hover:from-orange-600 hover:to-orange-700",
                    bg: "from-orange-50 to-amber-50",
                    text: "text-orange-600",
                    textDark: "text-orange-800",
                    badge: "bg-orange-100 text-orange-800 border-orange-200",
                    gradient: "from-orange-100 to-amber-100",
                    iconBg: "from-orange-100 to-amber-100",
                    iconColor: "text-orange-600",
                    accent: "bg-orange-500",
                    shadow: "shadow-orange-200/50",
                }
            case "director":
                return {
                    primary: "from-red-500 to-red-600",
                    primaryHover: "hover:from-red-600 hover:to-red-700",
                    bg: "from-red-50 to-rose-50",
                    text: "text-red-600",
                    textDark: "text-red-800",
                    badge: "bg-red-100 text-red-800 border-red-200",
                    gradient: "from-red-100 to-rose-100",
                    iconBg: "from-red-100 to-rose-100",
                    iconColor: "text-red-600",
                    accent: "bg-red-500",
                    shadow: "shadow-red-200/50",
                }
            case "department":
                return {
                    primary: "from-green-500 to-green-600",
                    primaryHover: "hover:from-green-600 hover:to-green-700",
                    bg: "from-green-50 to-emerald-50",
                    text: "text-green-600",
                    textDark: "text-green-800",
                    badge: "bg-green-100 text-green-800 border-green-200",
                    gradient: "from-green-100 to-emerald-100",
                    iconBg: "from-green-100 to-emerald-100",
                    iconColor: "text-green-600",
                    accent: "bg-green-500",
                    shadow: "shadow-green-200/50",
                }
            default:
                return {
                    primary: "from-blue-500 to-blue-600",
                    primaryHover: "hover:from-blue-600 hover:to-blue-700",
                    bg: "from-blue-50 to-indigo-50",
                    text: "text-blue-600",
                    textDark: "text-blue-800",
                    badge: "bg-blue-100 text-blue-800 border-blue-200",
                    gradient: "from-blue-100 to-indigo-100",
                    iconBg: "from-blue-100 to-indigo-100",
                    iconColor: "text-blue-600",
                    accent: "bg-blue-500",
                    shadow: "shadow-blue-200/50",
                }
        }
    }
    const themeColors = getThemeColor()

    const features = [
        {
            icon: Video,
            title: "HD Video Conferencing",
            description: "Crystal clear video calls with up to 1000 participants and screen sharing capabilities",
        },
        {
            icon: Calendar,
            title: "Smart Scheduling",
            description: "AI-powered scheduling that finds the perfect time for all attendees across time zones",
        },
        {
            icon: MessageSquare,
            title: "Real-time Collaboration",
            description: "Interactive whiteboards, chat, and file sharing during meetings",
        },
        {
            icon: Mic,
            title: "AI Transcription",
            description: "Automatic meeting transcription with speaker identification and key highlights",
        },
        {
            icon: FileText,
            title: "Meeting Minutes",
            description: "Auto-generated meeting minutes with action items and follow-up tasks",
        },
        {
            icon: BarChart3,
            title: "Analytics Dashboard",
            description: "Comprehensive meeting analytics and productivity insights",
        },
    ]

    return (
        <div className={`min-h-screen bg-gradient-to-br ${themeColors.bg} relative overflow-hidden`}>
            {/* Background decorations */}
            <div className="absolute top-32 left-16 w-40 h-40 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-20 right-32 w-28 h-28 bg-gradient-to-br from-white/15 to-white/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-32 left-1/3 w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-lg"></div>
            <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-white/15 to-white/5 rounded-full blur-xl"></div>

            <div className="relative z-10 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="relative mb-16">
                        <Card
                            className={`relative p-12 bg-white/80 backdrop-blur-sm shadow-2xl ${themeColors.shadow} border-0 rounded-3xl`}
                        >
                            <div className="flex flex-col items-center space-y-8">
                                <div className={`p-8 bg-gradient-to-br ${themeColors.iconBg} rounded-full shadow-lg`}>
                                    <Users className={`w-20 h-20 ${themeColors.iconColor}`} />
                                </div>

                                <div className="text-center space-y-4">
                                    <Badge className={`${themeColors.badge} text-sm px-4 py-2 font-semibold`}>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Coming Soon
                                    </Badge>

                                    <h1 className={`text-5xl md:text-6xl font-bold ${themeColors.textDark} leading-tight`}>
                                        Smart Meeting
                                        <br />
                                        <span className="bg-gradient-to-r from-current to-current bg-clip-text">Management</span>
                                    </h1>

                                    <p className={`text-xl md:text-2xl ${themeColors.text} max-w-3xl mx-auto leading-relaxed`}>
                                        Next-generation meeting platform with AI-powered features, seamless collaboration tools, and
                                        intelligent productivity insights.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className={`w-6 h-6 ${themeColors.text}`} />
                                        <span className={`text-lg font-medium ${themeColors.text}`}>Expected Launch: Soon</span>
                                    </div>

                                    {/* <Button
                    className={`bg-gradient-to-r ${themeColors.primary} ${themeColors.primaryHover} text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4 rounded-full`}
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Join Waitlist
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button> */}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Features Grid */}
                    <div className="mb-16">
                        <div className="text-center mb-12">
                            <h2 className={`text-4xl font-bold ${themeColors.textDark} mb-4`}>Revolutionary Meeting Experience</h2>
                            <p className={`text-xl ${themeColors.text} max-w-2xl mx-auto`}>
                                Transform how your team collaborates with cutting-edge meeting technology
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <Card
                                    key={index}
                                    className={`group p-8 bg-white/70 backdrop-blur-sm hover:bg-white/90 shadow-lg hover:shadow-2xl ${themeColors.shadow} border-0 rounded-2xl transition-all duration-300 hover:scale-105`}
                                >
                                    <div className="space-y-6">
                                        <div
                                            className={`p-4 bg-gradient-to-br ${themeColors.iconBg} rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <feature.icon className={`w-8 h-8 ${themeColors.iconColor}`} />
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className={`text-xl font-bold ${themeColors.textDark}`}>{feature.title}</h3>
                                            <p className={`${themeColors.text} leading-relaxed`}>{feature.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Integration Preview */}
                    <Card
                        className={`p-12 bg-white/80 backdrop-blur-sm shadow-2xl ${themeColors.shadow} border-0 rounded-3xl mb-16`}
                    >
                        <div className="text-center mb-8">
                            <h3 className={`text-3xl font-bold ${themeColors.textDark} mb-4`}>Seamless Integrations</h3>
                            <p className={`text-xl ${themeColors.text} max-w-2xl mx-auto`}>
                                Connect with your favorite tools and platforms
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="text-center space-y-4">
                                <div className={`p-4 bg-gradient-to-br ${themeColors.iconBg} rounded-2xl w-fit mx-auto`}>
                                    <Calendar className={`w-8 h-8 ${themeColors.iconColor}`} />
                                </div>
                                <div className={`${themeColors.text} font-medium`}>Calendar Apps</div>
                            </div>
                            <div className="text-center space-y-4">
                                <div className={`p-4 bg-gradient-to-br ${themeColors.iconBg} rounded-2xl w-fit mx-auto`}>
                                    <MessageSquare className={`w-8 h-8 ${themeColors.iconColor}`} />
                                </div>
                                <div className={`${themeColors.text} font-medium`}>Chat Platforms</div>
                            </div>
                            <div className="text-center space-y-4">
                                <div className={`p-4 bg-gradient-to-br ${themeColors.iconBg} rounded-2xl w-fit mx-auto`}>
                                    <FileText className={`w-8 h-8 ${themeColors.iconColor}`} />
                                </div>
                                <div className={`${themeColors.text} font-medium`}>Document Tools</div>
                            </div>
                            <div className="text-center space-y-4">
                                <div className={`p-4 bg-gradient-to-br ${themeColors.iconBg} rounded-2xl w-fit mx-auto`}>
                                    <Share2 className={`w-8 h-8 ${themeColors.iconColor}`} />
                                </div>
                                <div className={`${themeColors.text} font-medium`}>Cloud Storage</div>
                            </div>
                        </div>
                    </Card>

                    {/* Benefits Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        <Card className={`p-8 bg-white/70 backdrop-blur-sm shadow-xl ${themeColors.shadow} border-0 rounded-2xl`}>
                            <div className="space-y-6">
                                <div className={`p-4 bg-gradient-to-br ${themeColors.iconBg} rounded-2xl w-fit`}>
                                    <Zap className={`w-8 h-8 ${themeColors.iconColor}`} />
                                </div>
                                <h3 className={`text-2xl font-bold ${themeColors.textDark}`}>Boost Productivity</h3>
                                <p className={`${themeColors.text} text-lg leading-relaxed`}>
                                    Reduce meeting time by 40% with AI-powered agenda optimization and smart time management features.
                                </p>
                            </div>
                        </Card>

                        <Card className={`p-8 bg-white/70 backdrop-blur-sm shadow-xl ${themeColors.shadow} border-0 rounded-2xl`}>
                            <div className="space-y-6">
                                <div className={`p-4 bg-gradient-to-br ${themeColors.iconBg} rounded-2xl w-fit`}>
                                    <Shield className={`w-8 h-8 ${themeColors.iconColor}`} />
                                </div>
                                <h3 className={`text-2xl font-bold ${themeColors.textDark}`}>Enterprise Security</h3>
                                <p className={`${themeColors.text} text-lg leading-relaxed`}>
                                    End-to-end encryption, compliance certifications, and advanced security controls for peace of mind.
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* CTA Section
          <div className="text-center">
            <Card className={`p-12 bg-gradient-to-r ${themeColors.primary} shadow-2xl border-0 rounded-3xl`}>
              <div className="space-y-6">
                <Video className="w-16 h-16 text-white mx-auto" />
                <h3 className="text-3xl font-bold text-white">Ready to Revolutionize Your Meetings?</h3>
                <p className="text-xl text-white/90 max-w-2xl mx-auto">
                  Join thousands of teams waiting for the future of meeting management
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-white text-current hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4 rounded-full">
                    <Bell className="w-5 h-5 mr-2" />
                    Get Early Access
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4 rounded-full bg-transparent"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Learn More
                  </Button>
                </div>
              </div>
            </Card>
          </div> */}
                </div>
            </div>
        </div>
    )
}
