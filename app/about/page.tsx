import { Target, Users, Award, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description:
      "We're on a mission to make quality education accessible to everyone through interactive learning.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "We believe in the power of community and collaborative learning experiences.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "We strive for excellence in everything we do, from content quality to user experience.",
  },
  {
    icon: Heart,
    title: "Passion for Learning",
    description:
      "Our team is passionate about education and committed to helping you succeed.",
  },
];

const team = [
  {
    name: "Rahul Sharma",
    role: "Founder & CEO",
    bio: "Former educator with 10+ years of experience in ed-tech.",
  },
  {
    name: "Priya Patel",
    role: "Head of Content",
    bio: "Expert in curriculum design and educational content creation.",
  },
  {
    name: "Amit Kumar",
    role: "Lead Developer",
    bio: "Full-stack developer passionate about building learning tools.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Quiz Master</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;re building the future of interactive learning, one quiz at a time.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="prose prose-lg text-muted-foreground">
                <p className="mb-4">
                  Quiz Master was founded in 2024 with a simple idea: make learning
                  more engaging and accessible. We noticed that traditional
                  learning methods often fail to keep students motivated, and we
                  wanted to change that.
                </p>
                <p className="mb-4">
                  Our platform combines the power of interactive quizzes with
                  detailed explanations and progress tracking to create a
                  comprehensive learning experience. Whether you&apos;re preparing for
                  an exam or just want to learn something new, Quiz Master has
                  something for you.
                </p>
                <p>
                  Today, we&apos;re proud to serve thousands of learners across India,
                  helping them achieve their educational goals. But we&apos;re just
                  getting started.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title}>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {team.map((member) => (
                <Card key={member.name}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-primary mb-2">{member.role}</p>
                    <p className="text-muted-foreground text-sm">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10K+</div>
                <div className="text-primary-foreground/80">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-primary-foreground/80">Quizzes</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50K+</div>
                <div className="text-primary-foreground/80">Questions</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-primary-foreground/80">Satisfaction</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
