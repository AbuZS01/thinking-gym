/* Everyday job and creativity replacements.
 *
 * These replace thirty abstract challenges without increasing the size of the
 * challenge bank. Every fact or workplace rule needed to answer is included in
 * the scenario. Creative challenges score how well an idea fits clear limits;
 * the player's own idea remains optional and is never graded.
 */
const MTC_EVERYDAY_REPLACEMENTS = [
  {
    id: "gym-flaw-1", title: "A Customer Shouts About Their Coffee", emoji: "☕", difficulty: 1,
    areas: ["work", "relationships"], frameworks: ["communication", "emotional-regulation", "decision-making"],
    scenario: "You work in a coffee shop. A customer says their drink is wrong and raises their voice. The shop rule says to stay calm, check the order and involve the manager if anyone becomes threatening.",
    problem: "Solve the complaint without matching the customer's anger.",
    steps: [
      ["What should you do first?", "Listen, check the order and speak calmly", "This finds the real problem without adding more anger.", ["Tell them to calm down", "Raise your voice so they listen", "Ignore them and serve the next person"]],
      ["The drink was made incorrectly. What is the clearest response?", "Acknowledge the mistake and offer the shop's normal replacement", "A clear apology and practical fix deal with the real complaint.", ["Explain why the customer caused the mistake", "Offer something the shop cannot provide", "Argue about how busy the shop is"]],
      ["The customer threatens a member of staff. What now?", "Step back and involve the manager or security under the shop rule", "Safety comes before finishing the complaint yourself.", ["Threaten them back", "Block the exit", "Keep arguing until they apologise"]],
    ],
    principle: "Deal with the problem, not the volume. Listen, state the facts and use the safety rule when behaviour becomes threatening.",
    limit: "A calm response does not mean accepting abuse. Set a boundary and get help when the behaviour crosses it.",
  },
  {
    id: "gym-flaw-2", title: "The Factory Machine Sounds Wrong", emoji: "🏭", difficulty: 1,
    areas: ["work", "safety"], frameworks: ["situational-awareness", "risk-assessment", "decision-making"],
    scenario: "You work near a packing machine. It starts making a new grinding sound. The posted rule says: do not reach inside, press the normal stop button if safe, keep people back and tell the trained supervisor.",
    problem: "Follow the stated safety rule instead of guessing at the fault.",
    steps: [
      ["What is the important new clue?", "The machine is making a sound it did not make before", "A change can warn of a developing fault even when the machine still runs.", ["The shift is nearly over", "The boxes look normal", "Nobody else has complained"]],
      ["What should you do if the stop button is safe to reach?", "Use it, keep people back and report the problem", "This follows every part of the rule without touching the machine.", ["Reach inside to feel what is loose", "Keep it running until the break", "Hit the machine to stop the noise"]],
      ["Why should a trained person check it?", "The cause is unknown and opening it needs the right training", "Reporting uncertainty is safer than attempting a repair you are not trained to make.", ["Supervisors are always right", "The sound proves the motor is broken", "Only managers may hear unusual sounds"]],
    ],
    principle: "Notice changes, stop safely and pass technical faults to someone trained to deal with them.",
    limit: "Not every new sound means serious danger. The stated procedure lets the right person check without gambling with safety.",
  },
  {
    id: "gym-flaw-3", title: "A Student Is Falling Behind", emoji: "📚", difficulty: 1,
    areas: ["work", "study"], frameworks: ["communication", "questioning", "decision-making"],
    scenario: "You teach a class. One student has stopped handing in work and avoids questions. You do not know why. School guidance says to speak privately, ask open questions and report any safeguarding concern.",
    problem: "Find out what support is needed without making a public assumption.",
    steps: [
      ["What should you avoid assuming?", "That the student is lazy", "Missing work can have many causes, and the facts given do not show which one applies.", ["That work is missing", "That a private talk is possible", "That the guidance exists"]],
      ["What is a useful private question?", "I noticed some work is missing. Is anything making it hard to complete?", "It names the fact and gives the student room to explain.", ["Why are you so lazy?", "Everyone else can do it, so why can't you?", "Will you promise never to miss work again?"]],
      ["The student mentions feeling unsafe at home. What now?", "Follow the school's safeguarding procedure", "A possible safety concern must go to the people trained and responsible for acting.", ["Promise to keep it completely secret", "Investigate the family yourself", "Discuss it with the whole class"]],
    ],
    principle: "Start with what you observed, ask without blame and use the proper support route when safety may be involved.",
    limit: "Open questions do not remove the teacher's duty to act. A safeguarding concern must still be reported through the stated procedure.",
  },
  {
    id: "gym-flaw-4", title: "A Child Steps Near the Road", emoji: "🚗", difficulty: 1,
    areas: ["safety"], frameworks: ["hazard-perception", "risk-assessment", "decision-making"],
    scenario: "You are driving at 20 mph past parked cars. A ball rolls into the road and you can see a child's shoes between two cars. The road behind you is clear.",
    problem: "Recognise the developing hazard before the child enters the road.",
    steps: [
      ["What does the ball suggest?", "A child may follow it into the road", "The ball and the visible shoes together create a clear developing hazard.", ["The road is now closed", "The parked cars will move", "The speed limit has changed"]],
      ["What is the safest immediate response?", "Slow down and be ready to stop", "Reducing speed creates more time and stopping distance if the child appears.", ["Speed up before the child arrives", "Sound the horn and keep the same speed", "Move onto the pavement"]],
      ["Why is waiting for the child to appear weaker?", "It leaves less time and distance to stop", "Hazard awareness means acting on a strong warning, not waiting for the danger to be fully visible.", ["Children may never cross roads", "Brakes only work below 20 mph", "Parked cars always have priority"]],
    ],
    principle: "Look for clues that a hazard is developing and create time to respond before it becomes an emergency.",
    limit: "A ball does not prove a child will run out. Slowing down is still a small, safe response to a serious possibility.",
  },
  {
    id: "gym-flaw-5", title: "The Emergency Alarm at a Nuclear Site", emoji: "🚨", difficulty: 1,
    areas: ["work", "safety"], frameworks: ["instruction-following", "prioritisation", "risk-assessment"],
    scenario: "You are a visitor at a nuclear site. Your badge lists the alarm rule: stop work, leave by the marked route, go to the meeting point and report to the person in charge. Do not collect belongings or return until told.",
    problem: "Put safety instructions ahead of curiosity or personal items.",
    steps: [
      ["The alarm sounds. What should you do first?", "Stop work and use the marked route", "That is the first action on the rule provided in the scenario.", ["Search online for the cause", "Collect your coat and bag", "Wait to see what everyone else does"]],
      ["Where should you go?", "The stated meeting point", "The meeting point lets staff account for people and give further instructions.", ["Your car", "The nearest office", "Back to the entrance desk"]],
      ["You remember your phone inside. What now?", "Stay at the meeting point and tell the person in charge", "The rule clearly says not to return for belongings.", ["Go back quickly on your own", "Ask another visitor to get it", "Leave the site without reporting"]],
    ],
    principle: "In a high-risk setting, follow the clear emergency procedure in order and let trained staff manage the unknown details.",
    limit: "Procedures differ by site. This challenge tests the instructions shown here, not specialist nuclear knowledge.",
  },
  {
    id: "gym-flaw-6", title: "A Child Has a Public Meltdown", emoji: "🧸", difficulty: 1,
    areas: ["relationships", "home"], frameworks: ["emotional-regulation", "communication", "decision-making"],
    scenario: "Your five-year-old becomes overwhelmed in a busy shop and starts shouting. They are safe, but noise and people are making things worse. You need to leave soon.",
    problem: "Lower the pressure first, then deal with the behaviour.",
    steps: [
      ["What should come first?", "Move to a quieter safe place and speak calmly", "Reducing noise and attention can help the child regain control.", ["Give a long lecture in front of everyone", "Shout louder than the child", "Threaten a punishment you will not use"]],
      ["What is a clear short message?", "You are safe. We are going somewhere quieter now", "It gives reassurance and one simple next step.", ["You always ruin everything", "Stop immediately or I will leave you here", "Explain yourself properly right now"]],
      ["When should you discuss what happened?", "After both of you are calmer", "Learning and problem-solving work better when the immediate overload has passed.", ["Only while the child is shouting", "Never mention it again", "In front of strangers so they agree"]],
    ],
    principle: "Regulate first, connect second and teach later. A calm boundary is easier to follow than a public argument.",
    limit: "Calm support is not the same as removing every boundary. The behaviour can still be discussed once everyone is able to listen.",
  },
  {
    id: "gym-flaw-7", title: "A Warehouse Label Does Not Match", emoji: "📦", difficulty: 1,
    areas: ["work", "safety"], frameworks: ["attention-to-detail", "risk-assessment", "decision-making"],
    scenario: "A damaged box is labelled as cleaning cloths, but the paperwork lists cleaning liquid. The warehouse rule says to set aside damaged or mismatched goods and tell the shift lead. Do not open unknown packages.",
    problem: "Treat the mismatch as something to check, not something to guess away.",
    steps: [
      ["What is the main warning sign?", "The label and paperwork describe different contents", "A mismatch means the package cannot be handled with confidence.", ["The box is brown", "The shift is busy", "The label uses small text"]],
      ["What should you do?", "Set it aside safely and tell the shift lead", "This follows the stated rule and prevents the box moving further by mistake.", ["Open it and smell the contents", "Change the paperwork yourself", "Send it out and let the customer decide"]],
      ["Why not assume it contains cloths?", "The damaged box and conflicting record leave the contents uncertain", "One label is not enough when another trusted record disagrees.", ["Cloths are never delivered", "All damaged boxes contain liquid", "Paperwork is always false"]],
    ],
    principle: "Stop mismatched items from moving, preserve the evidence and pass the check to the responsible person.",
    limit: "A mismatch may be a simple typing error. Following the check does not accuse anyone; it prevents a small error becoming a larger one.",
  },
  {
    id: "gym-flaw-8", title: "The Delivery Location Feels Unsafe", emoji: "🚚", difficulty: 1,
    areas: ["work", "safety"], frameworks: ["situational-awareness", "boundary-setting", "decision-making"],
    scenario: "You are making a late delivery. The customer messages you to enter an unlit alley behind an empty building. Company guidance says drivers may use a safe public meeting point or mark a delivery unsafe and contact support.",
    problem: "Complete the job only through a safe method.",
    steps: [
      ["What makes the request a concern?", "It moves you alone into a dark, isolated place", "Isolation and poor visibility increase risk and reduce access to help.", ["The customer sent a message", "The parcel is small", "The address has a building number"]],
      ["What is a reasonable alternative?", "Offer a lit public meeting point and contact support if needed", "This uses the company guidance and still offers a way to complete the delivery.", ["Enter the alley to avoid a complaint", "Leave the parcel in the road", "Argue with the customer about their motive"]],
      ["The customer refuses every safe option. What now?", "Mark it unsafe and follow support instructions", "You do not need to prove bad intent before using the safety process.", ["Go in because they paid", "Share your home address", "Ask another customer to enter for you"]],
    ],
    principle: "Separate the delivery goal from an unsafe method. Offer a safe alternative and use support when it is refused.",
    limit: "An unusual location does not prove the customer is dangerous. A safer method protects both people without making that accusation.",
  },
  {
    id: "gym-flaw-9", title: "An Angry Refund Request", emoji: "🧾", difficulty: 1,
    areas: ["work", "money"], frameworks: ["communication", "policy-reading", "decision-making"],
    scenario: "A customer wants a cash refund for an item without a receipt. The displayed policy allows an exchange or store credit after the item is checked. A manager must approve any exception.",
    problem: "Explain the available options without inventing a rule.",
    steps: [
      ["What should you check first?", "The item and the displayed refund policy", "The condition of the item and written policy determine the normal options.", ["How loudly the customer complains", "Whether you personally like the item", "How much cash is in your wallet"]],
      ["What can you offer under the normal policy?", "An exchange or store credit after the check", "Those are the options stated in the scenario.", ["A guaranteed cash refund", "A replacement from your own money", "Nothing at all"]],
      ["The customer demands an exception. What next?", "Ask the manager to decide", "The policy clearly gives exception decisions to the manager.", ["Change the policy yourself", "Promise the exception before asking", "Hide the item"]],
    ],
    principle: "Use the written rule, explain the available choices and pass exceptions to the person authorised to decide.",
    limit: "Policies should not be used to dismiss people. Listen and explain clearly, while staying within the authority you actually have.",
  },
  {
    id: "gym-flaw-10", title: "A Customer Reports a Food Allergy", emoji: "🍽️", difficulty: 1,
    areas: ["work", "health", "safety"], frameworks: ["risk-assessment", "communication", "instruction-following"],
    scenario: "A restaurant customer says they have a severe nut allergy. The kitchen guide says staff must tell the duty manager and chef, check the written ingredient information and never promise that a dish is safe without confirmation.",
    problem: "Use the allergy process instead of relying on memory.",
    steps: [
      ["What should you do with the allergy information?", "Tell the duty manager and chef clearly", "The stated guide requires the people responsible for service and preparation to know.", ["Keep it to yourself", "Mention it only after the meal", "Ask another customer to decide"]],
      ["You remember that the dish has no nuts. Is memory enough?", "No, check the written information and get confirmation", "Ingredients and preparation can change, so the guide requires a current check.", ["Yes, memory is always reliable", "Yes, if the restaurant is quiet", "Only the menu price matters"]],
      ["The kitchen cannot confirm it is safe. What should you say?", "Explain that it cannot be confirmed and help find a confirmed option", "Honest uncertainty is safer than a promise the kitchen cannot support.", ["Promise it is probably fine", "Remove visible nuts and serve it", "Tell the customer allergies are their problem"]],
    ],
    principle: "Treat allergy information as safety-critical: communicate it, check current records and never turn uncertainty into a promise.",
    limit: "This challenge uses the restaurant rule shown here. Real workplaces may have additional steps that staff must follow.",
  },
  {
    id: "gym-flaw-11", title: "A Person in Your Care Seems Confused", emoji: "🫶", difficulty: 1,
    areas: ["work", "health"], frameworks: ["situational-awareness", "communication", "escalation"],
    scenario: "You support an older person who is normally alert. Today they suddenly seem confused and unsteady. Your care plan says sudden changes must be reported at once to the nurse in charge, and the person should not be left alone.",
    problem: "Act on the change without trying to diagnose it yourself.",
    steps: [
      ["What is the key fact?", "The confusion and unsteadiness are sudden changes", "A clear change from the person's normal state is the important warning.", ["The person is older", "The room is warm", "It is a weekday"]],
      ["What does the care plan tell you to do?", "Stay with them and report at once to the nurse in charge", "Both actions are stated directly in the plan.", ["Wait until tomorrow", "Ask them to walk alone", "Give medicine without instruction"]],
      ["Why should you avoid guessing the cause?", "Different causes need different trained assessment", "Reporting observed facts gets the person the right help without an unsupported diagnosis.", ["Confusion has only one cause", "Care workers may never speak", "The cause does not matter to anyone"]],
    ],
    principle: "Notice sudden change, keep the person safe and report clear observations to the responsible professional.",
    limit: "Not every moment of confusion is an emergency. The care plan makes a sudden change the reason to report promptly.",
  },
  {
    id: "gym-flaw-12", title: "The Ladder Is Missing a Foot", emoji: "🪜", difficulty: 1,
    areas: ["work", "safety"], frameworks: ["risk-assessment", "instruction-following", "decision-making"],
    scenario: "You need to reach a ceiling cable. One rubber foot is missing from the ladder, so it rocks on the floor. The site rule says damaged access equipment must be labelled, removed from use and reported.",
    problem: "Choose the safe action even though the task is short.",
    steps: [
      ["What is the relevant problem?", "The ladder rocks because a foot is missing", "The equipment is unstable and therefore damaged.", ["The cable is on the ceiling", "The job may be quick", "A coworker is nearby"]],
      ["What should you do with the ladder?", "Label it, remove it from use and report it", "That is the full site rule given in the scenario.", ["Use it while someone holds one side", "Put folded paper under it", "Leave it for the next worker"]],
      ["Why does a short job not change the answer?", "A fall can happen before the job is finished", "Short exposure can still lead to serious harm when equipment is unstable.", ["Short jobs are always harder", "Time never matters in any decision", "The ladder will repair itself"]],
    ],
    principle: "Do not trade equipment safety for speed. Remove damaged equipment so nobody else mistakes it for safe equipment.",
    limit: "This does not mean every mark or scratch makes equipment unusable. Follow the stated inspection rule and report uncertainty.",
  },
  {
    id: "gym-flaw-13", title: "Two Cleaning Products", emoji: "🧴", difficulty: 1,
    areas: ["work", "home", "health", "safety"], frameworks: ["instruction-reading", "risk-assessment", "decision-making"],
    scenario: "You are cleaning a bathroom. One bottle says: 'Do not mix with other products.' A coworker suggests adding another cleaner to make it work faster.",
    problem: "Use the warning on the product rather than an informal shortcut.",
    steps: [
      ["Which information should guide the decision?", "The warning printed on the bottle", "It directly covers the suggested action and comes from the product instructions.", ["The colour of the bottle", "How quickly the coworker speaks", "The size of the bathroom"]],
      ["What should you do?", "Use the product as directed and do not mix it", "This follows the clear safety warning.", ["Mix a small amount to test it", "Smell both products closely", "Use every cleaner available"]],
      ["The product is not working well. What is a safe next step?", "Stop and check the approved method or ask the supervisor", "A safer method can be found without breaking the warning.", ["Add more unknown chemicals", "Heat the mixture", "Remove the warning label"]],
    ],
    principle: "A clear product warning beats a shortcut. Stop and find an approved method when the instructed method is not working.",
    limit: "Different products have different instructions. Read the label each time rather than assuming all cleaners behave the same way.",
  },
  {
    id: "gym-flaw-14", title: "A Child Is Lost in the Shopping Centre", emoji: "🛡️", difficulty: 1,
    areas: ["work", "relationships", "safety"], frameworks: ["safeguarding", "communication", "instruction-following"],
    scenario: "You work in shopping-centre security. A crying child says they cannot find their parent. The procedure says to stay in a public camera-covered area, alert the control room, use two staff members and never announce the child's name.",
    problem: "Help the child while following the safeguarding procedure.",
    steps: [
      ["Where should you stay with the child?", "In the public camera-covered area", "The stated procedure keeps the interaction visible and supported.", ["Inside a locked office alone", "Outside the building", "In your personal car"]],
      ["Who should you contact?", "The control room and a second staff member", "Both are required by the procedure in the scenario.", ["Only your personal social media", "No one until closing time", "A random shopper"]],
      ["What should an announcement avoid?", "The child's name", "The procedure specifically protects that identifying detail.", ["A request for the parent to contact staff", "The meeting location for the parent", "The centre's name"]],
    ],
    principle: "Safeguarding means helping in a visible, recorded and supported way while limiting unnecessary personal information.",
    limit: "Real safeguarding procedures vary. Staff must follow their own workplace process and involve emergency services when required.",
  },
  {
    id: "gym-flaw-15", title: "Two Managers, Two Deadlines", emoji: "🗓️", difficulty: 1,
    areas: ["work"], frameworks: ["prioritisation", "communication", "decision-making"],
    scenario: "One manager asks for a stock count by 2 pm. Another asks for a customer report by the same time. Each job takes three hours, and you have four hours available. Neither manager knows about the other request.",
    problem: "Make the conflict visible before quietly missing a deadline.",
    steps: [
      ["What is the real problem?", "Both jobs cannot be completed by 2 pm with the time available", "The work needs six hours, but only four hours are available.", ["Both managers dislike you", "The jobs are impossible to complete ever", "You must choose the shortest job"]],
      ["What should you do first?", "Tell both managers about the conflict and ask which outcome matters most", "The people setting priorities need the same facts before choosing.", ["Say yes to both and hide the delay", "Pick one without telling anyone", "Work unsafely fast"]],
      ["What should your message include?", "The two requests, their effort, the shared deadline and realistic options", "Specific facts make it easier to change scope, timing or ownership.", ["A complaint about both managers", "A promise that everything will be done", "Only the task you prefer"]],
    ],
    principle: "When priorities conflict, show the full workload early and ask the responsible people to make the trade-off visible.",
    limit: "You may sometimes need to make an urgent choice yourself. Even then, explain the reason and impact as soon as you can.",
  },
  {
    id: "gym-flaw-16", title: "An Abusive Caller", emoji: "🎧", difficulty: 1,
    areas: ["work", "relationships"], frameworks: ["boundary-setting", "communication", "emotional-regulation"],
    scenario: "You work in a call centre. A caller starts insulting you. The call rule says: give one calm warning, offer help with the account problem and end or transfer the call if the abuse continues.",
    problem: "Keep the boundary clear while leaving a route back to the real problem.",
    steps: [
      ["What should the warning do?", "Name the behaviour, set the boundary and offer help with the account", "It separates the caller's problem from unacceptable treatment of staff.", ["Insult the caller back", "Threaten something outside the rule", "Pretend the abuse did not happen"]],
      ["The caller stops insulting you. What next?", "Return to the account problem", "The boundary worked, so the useful conversation can continue.", ["Demand a personal apology before any help", "End the call without explanation", "Discuss the caller with other customers"]],
      ["The abuse continues. What now?", "End or transfer the call under the rule", "The scenario gives this as the next step after the warning fails.", ["Stay on the call for any length of time", "Give out private staff details", "Make a promise you cannot keep"]],
    ],
    principle: "A good boundary is calm, specific and followed by the action you said you would take.",
    limit: "Ending abuse does not solve the account problem. Record or transfer it properly so a valid issue can still be handled safely.",
  },
  {
    id: "gym-flaw-17", title: "A Passenger Becomes Unwell", emoji: "🚌", difficulty: 1,
    areas: ["work", "health", "safety"], frameworks: ["situational-awareness", "prioritisation", "instruction-following"],
    scenario: "You drive a bus. A passenger collapses in the aisle. The company card says: stop in a safe place, secure the vehicle, call emergency help, give the location and follow the call handler's instructions.",
    problem: "Protect the whole bus while getting trained help quickly.",
    steps: [
      ["What should you do with the bus first?", "Stop safely and secure it", "A moving bus adds danger to the unwell passenger and everyone else.", ["Keep driving to stay on time", "Ask passengers to hold the steering wheel", "Reverse into traffic"]],
      ["What information should the emergency call include?", "What happened and the bus's location", "The call handler needs the situation and location to send the right help.", ["Your opinion of the passenger", "The full route timetable", "A guess about the final diagnosis"]],
      ["Who should guide any first-aid action?", "The emergency call handler and your training", "The stated rule connects action to trained guidance rather than guesswork.", ["A social media comment", "A passenger who wants to leave", "An advert on the bus"]],
    ],
    principle: "Stop new danger, call trained help and communicate clear facts rather than guessing at a diagnosis.",
    limit: "Procedures and training differ. Drivers should follow their company process and local emergency guidance.",
  },
  {
    id: "gym-flaw-18", title: "Someone Asks for a Hotel Guest's Room", emoji: "🏨", difficulty: 1,
    areas: ["work", "safety"], frameworks: ["privacy", "verification", "communication"],
    scenario: "At a hotel desk, a person asks for a guest's room number and says they are a close friend. Hotel policy says never reveal whether someone is staying or give their room number. Staff may offer to take a message.",
    problem: "Protect the guest's privacy without accusing the visitor.",
    steps: [
      ["Does being a close friend prove permission?", "No, the desk cannot verify the claim from those words", "The relationship claim is not independent permission from the guest.", ["Yes, friends may enter any room", "Yes, if the visitor sounds confident", "Only if the lobby is busy"]],
      ["What should you say?", "I cannot confirm guest details, but I can take a message", "This follows the policy and offers a safe alternative.", ["They are in room 204", "They are not here today", "Wait by the lifts and watch"]],
      ["Why can you not even confirm the stay?", "That information could help someone locate or target the guest", "Privacy includes whether the person is present, not only the room number.", ["Hotels have no rooms", "Guests never receive visitors", "The computer cannot show bookings"]],
    ],
    principle: "Verify permission before sharing personal information and offer a method that leaves control with the person concerned.",
    limit: "Emergency services or authorised staff may follow a different verified process. Use the hotel's policy for those cases.",
  },
  {
    id: "gym-workout-1", title: "Pressure to Approve a Car", emoji: "🔧", difficulty: 1,
    areas: ["work", "safety"], frameworks: ["professional-judgement", "risk-assessment", "communication"],
    scenario: "You are checking a car before it is returned. A required brake check is unfinished, but a manager says the customer is waiting and asks you to approve it now. The garage rule says an unchecked safety item cannot be signed off.",
    problem: "Handle time pressure without giving a false safety approval.",
    steps: [
      ["What fact controls the decision?", "The required brake check is unfinished", "The rule directly says an unchecked safety item cannot be approved.", ["The customer is waiting", "The manager sounds certain", "The car looks clean"]],
      ["What should you do?", "Explain the missing check and do not sign until it is completed", "This keeps the record honest and follows the safety rule.", ["Sign and check it next week", "Ask the customer to sign for you", "Remove the brake check from the form"]],
      ["What useful option can you offer?", "Give a realistic completion time or ask for another trained person to check it", "This addresses the delay without pretending the work is complete.", ["Promise it is safe without checking", "Blame the customer", "Hide the car keys"]],
    ],
    principle: "Never turn schedule pressure into a false safety record. State the missing check and offer a truthful route forward.",
    limit: "Not every unfinished task is safety-critical. This scenario states that the brake check is required before approval.",
  },
  {
    id: "gym-workout-3", title: "A Customer Dislikes Their Haircut", emoji: "✂️", difficulty: 1,
    areas: ["work", "relationships"], frameworks: ["communication", "emotional-regulation", "problem-solving"],
    scenario: "A customer looks upset after a haircut and says it is shorter than requested. You cannot put the hair back, but the salon allows a senior stylist to review the result and discuss a correction or refund.",
    problem: "Respond honestly to a mistake that cannot simply be undone.",
    steps: [
      ["What should you do first?", "Listen and ask what part differs from what they expected", "Specific information is more useful than defending the result immediately.", ["Tell them they are wrong", "Avoid looking at the haircut", "Say every customer likes it"]],
      ["What should you avoid promising?", "That the hair can be restored immediately", "That outcome is impossible, so the promise would deepen the problem.", ["That a senior stylist can review it", "That you will listen", "That the salon has a process"]],
      ["What is a practical next step?", "Acknowledge the concern and involve the senior stylist to discuss available remedies", "It combines honesty, authority and realistic choices.", ["Cut more without asking", "Post the complaint online", "Make the customer pay again before speaking"]],
    ],
    principle: "When harm cannot be fully undone, listen, acknowledge it and offer the best realistic remedy through the proper process.",
    limit: "A complaint does not automatically prove poor work. First compare the agreed request with the result and listen to the customer's concern.",
  },
  {
    id: "gym-workout-4", title: "The Coffee Shop Card Machine Is Down", emoji: "💡", difficulty: 2, creativity: true,
    areas: ["work", "money"], frameworks: ["creative-problem-solving", "constraint-thinking", "communication"],
    scenario: "The card machine stops working during the morning rush. The shop may take cash, display a clear notice and direct customers to the nearby cash machine. Staff may not record card details or offer unpaid drinks.",
    problem: "Find a useful response that stays inside every stated limit.",
    prompt: "Think of one more way to make the wait or payment choice clearer without storing card details or giving products away.",
    steps: [
      ["Which idea fits all the rules?", "Put a notice at the entrance, tell the queue and accept cash while the machine is checked", "It informs people early and uses only an allowed payment method.", ["Write down card numbers for later", "Serve everyone without payment", "Hide the problem until customers reach the till"]],
      ["How could staff reduce wasted waiting?", "Have one person explain the payment choices before customers order", "Early information lets each customer decide before joining a long queue.", ["Say nothing unless asked", "Promise the machine will work in one minute", "Lock the entrance without explanation"]],
      ["How should you judge another idea?", "Check that it is legal, clear, practical and within the shop rules", "Creative ideas are useful only when they solve the problem without creating a larger one.", ["Choose the strangest idea", "Choose the idea with the most words", "Ignore the stated limits"]],
    ],
    principle: "Creativity works best inside clear limits. Generate options, then test each one for safety, honesty and practical value.",
    limit: "There may be several good answers. The scored options test the limits shown here, not whether one idea is the only creative solution.",
  },
  {
    id: "gym-workout-5", title: "Reduce Walking at the Packing Table", emoji: "🧠", difficulty: 2, creativity: true,
    areas: ["work"], frameworks: ["process-improvement", "observation", "creative-problem-solving"],
    scenario: "At a factory packing table, workers walk six steps to collect tape for every box. The tape can be moved, but emergency paths must stay clear and sharp tools must remain in their marked holder.",
    problem: "Improve the work without moving the risk somewhere else.",
    prompt: "Sketch another layout that reduces repeated movement while keeping the emergency path and tool holder clear.",
    steps: [
      ["Which change directly removes repeated walking?", "Place the tape within safe reach at each packing position", "It removes the repeated trip while respecting the stated movable item.", ["Ask workers to walk faster", "Block the emergency path with tape boxes", "Move sharp tools into open trays"]],
      ["What should be checked before keeping the new layout?", "Whether movement falls and the path and tool rules still pass", "A small trial should measure the benefit and check that safety was preserved.", ["Whether the table looks expensive", "Whether one box was packed quickly", "Whether nobody asks questions"]],
      ["Why test a small change first?", "It reveals problems before every station is changed", "A reversible trial creates evidence at low cost.", ["Testing guarantees perfection", "Workers cannot suggest improvements", "Every layout works in every factory"]],
    ],
    principle: "Observe repeated effort, change the cause and test the result without breaking safety limits.",
    limit: "The closest position is not always the safest or fastest overall. Check reach, space and how the whole task flows.",
  },
  {
    id: "gym-workout-6", title: "Explain Fractions Without a Textbook", emoji: "🍕", difficulty: 2, creativity: true,
    areas: ["work", "study"], frameworks: ["analogy", "communication", "creative-problem-solving"],
    scenario: "A student does not understand that one half and two quarters can represent the same amount. You have paper, a pen and four equal bottle tops. The student understands sharing food equally.",
    problem: "Connect the new idea to something the student already understands.",
    prompt: "Create your own simple example of two different fractions that show the same amount.",
    steps: [
      ["Which demonstration uses the student's existing knowledge?", "Draw one pizza split in halves and another equal pizza split in quarters", "Equal pizzas make it possible to compare one half with two quarters directly.", ["Repeat the fraction names more loudly", "Use two pizzas of different sizes", "Change the subject to multiplication"]],
      ["What must stay equal for the comparison to be fair?", "The size of the whole pizza", "Fractions of different-sized wholes cannot be compared by pieces alone.", ["The colour of the pen", "The number of words used", "The student's favourite topping"]],
      ["How can the bottle tops help?", "Split four equal tops into two equal groups, then show each group has two quarters of the four", "The objects make the equal parts visible and touchable.", ["Hide three tops", "Use tops of very different sizes", "Call every top one half"]],
    ],
    principle: "A useful explanation links the new idea to a familiar one while keeping the important parts of the comparison equal.",
    limit: "An analogy supports understanding but does not replace every formal rule. Check that the student can use the idea in a new example.",
  },
  {
    id: "gym-workout-8", title: "The Delivery Road Is Closed", emoji: "🗺️", difficulty: 2, creativity: true,
    areas: ["work", "safety"], frameworks: ["adaptation", "route-planning", "constraint-thinking"],
    scenario: "A road closure blocks the next three deliveries. The van may use public roads, but it cannot enter roads marked for buses only. One parcel has a promised delivery window ending in 40 minutes; the others end later.",
    problem: "Build a new route using the limits and deadlines given.",
    prompt: "Think of another safe route or customer update that would reduce the effect of the closure.",
    steps: [
      ["What should you identify first?", "Which open legal routes can reach the parcel with the nearest deadline", "The urgent window and legal-road limit shape the useful options.", ["The fastest bus-only road", "The customer's favourite colour", "The route you always use even though it is closed"]],
      ["No legal route can meet the 40-minute window. What next?", "Update the customer or dispatcher early with an honest estimate", "Early information lets others adapt and avoids a false promise.", ["Mark it delivered", "Drive through the closure", "Turn off the tracking device"]],
      ["How should two possible routes be compared?", "Safety, legality, arrival time and effect on the later deliveries", "A creative route is only useful if it fits all important limits.", ["Choose the route with the funniest street names", "Count only distance and ignore closures", "Choose randomly without checking"]],
    ],
    principle: "When a plan breaks, keep the real constraints, generate alternatives and communicate early when no option meets the original promise.",
    limit: "The shortest route is not always the quickest or safest. Use current road information and workplace guidance.",
  },
  {
    id: "gym-workout-10", title: "A Calmer Morning With Children", emoji: "🌅", difficulty: 2, creativity: true,
    areas: ["home", "relationships"], frameworks: ["process-design", "creative-problem-solving", "habit-building"],
    scenario: "School mornings often run late. Shoes go missing, breakfast choices take too long and bags are packed at the door. You cannot change the school time, and the children still need breakfast, clothes, bags and a safe trip.",
    problem: "Change the routine instead of repeating the same rushed morning.",
    prompt: "Design one small evening change and one morning choice that could make your own routine calmer.",
    steps: [
      ["Which idea moves avoidable work out of the busy period?", "Pack bags and choose clothes the evening before", "Those tasks do not need to wait until the morning.", ["Wake everyone five minutes later", "Search for shoes only when leaving", "Add more breakfast choices"]],
      ["How could breakfast decisions be simpler?", "Offer two suitable choices instead of asking an unlimited question", "A small choice keeps involvement while reducing delay.", ["Prepare nothing and debate every option", "Skip food every day", "Let each person cook a new recipe"]],
      ["How should the new routine be tested?", "Try it for several mornings and change the part that still causes delay", "A short test shows whether the idea works in real family life.", ["Judge it after one unusual morning", "Never change it again", "Measure only whether the parent is happy"]],
    ],
    principle: "Redesign repeated problems by moving tasks, reducing decisions and improving the part that still causes delay.",
    limit: "Families have different needs, ages and resources. The best routine is one that is safe, workable and respectful for that household.",
  },
  {
    id: "gym-workout-11", title: "Make the Office Form Easier", emoji: "📝", difficulty: 2, creativity: true,
    areas: ["work"], frameworks: ["plain-language", "process-improvement", "user-centred-design"],
    scenario: "New starters often leave a form incomplete. It asks for 'authorising stakeholder details' before explaining that this means the manager who approved the request. The legal questions must remain, but headings, order and help text can change.",
    problem: "Make the form clearer without removing required information.",
    prompt: "Rewrite one confusing label from a form you know using words a new person would understand.",
    steps: [
      ["Which label is clearer?", "Manager who approved this request", "It uses the meaning people need instead of an unexplained specialist phrase.", ["Authorising stakeholder details", "Approval entity data object", "Relevant person stuff"]],
      ["Where should short help text appear?", "Beside the question where the person needs it", "Help at the point of difficulty reduces searching and guessing.", ["Only in a separate fifty-page guide", "After the form is submitted", "Hidden behind an unrelated heading"]],
      ["How can you check the redesign?", "Ask a few new starters to complete it and note where they pause", "Watching real use reveals confusion that the writer may no longer notice.", ["Ask only the original writer", "Count the number of colours", "Assume shorter always means clearer"]],
    ],
    principle: "Use the reader's words, place help where it is needed and test the result with the people who actually use it.",
    limit: "Plain language must keep the legal meaning. Ask the responsible expert to check accuracy after the wording is simplified.",
  },
  {
    id: "gym-chain-3", title: "Create Storage Without Buying Furniture", emoji: "🏠", difficulty: 2, creativity: true,
    areas: ["home", "money"], frameworks: ["constraint-thinking", "reuse", "creative-problem-solving"],
    scenario: "A small bedroom has clothes on the floor. You have strong empty boxes, labels and space under the bed. You cannot spend money or block the door, heater or walkway.",
    problem: "Use what is available while keeping the room safe and usable.",
    prompt: "Find another safe use for an item you already own instead of buying new storage.",
    steps: [
      ["Which idea fits every limit?", "Sort the clothes into labelled boxes that slide under the bed", "It uses available items, costs nothing and keeps the walkway clear.", ["Stack boxes in front of the door", "Cover the heater with clothes", "Buy a large wardrobe"]],
      ["What makes labels useful?", "They reduce the need to open every box when looking for something", "The system saves time only if people can find and return items.", ["They make boxes stronger", "They create more floor space by themselves", "They remove the need to sort"]],
      ["What should you check after a week?", "Whether items are easy to find and the safe areas remain clear", "A practical idea should work during normal use, not only on the first day.", ["Whether the boxes look new", "Whether nobody entered the room", "Whether every box is the same colour"]],
    ],
    principle: "Creativity often means seeing a new use for what is already available, then checking that the solution remains safe in daily use.",
    limit: "Cardboard is not suitable for damp areas, heavy loads or places where it creates a fire risk. Match the material to the job.",
  },
  {
    id: "gym-chain-4", title: "Plan a Good Day With £10", emoji: "🎈", difficulty: 2, creativity: true,
    areas: ["money", "relationships"], frameworks: ["budgeting", "creative-problem-solving", "trade-offs"],
    scenario: "You want to spend a day with a friend and have £10 in total. Bus travel would cost £6. A nearby park and community gallery are free, and food from home is available.",
    problem: "Create an enjoyable plan without pretending the budget is larger.",
    prompt: "Plan your own low-cost day using one free place, something from home and a small amount kept for unexpected costs.",
    steps: [
      ["Which plan stays within the budget and keeps some money spare?", "Walk to the park and gallery, bring food and keep the £10 for a drink or unexpected need", "It uses the free options and does not spend the whole budget before the day begins.", ["Spend £12 on tickets", "Take the bus and buy two £5 meals", "Borrow money without asking"]],
      ["What is the useful creative move?", "Change the activity and transport rather than giving up the whole day", "The goal is time together, so several costly methods can change.", ["Ignore every price", "Hide the budget from your friend", "Assume free places are closed"]],
      ["What should you agree with your friend?", "The budget, travel plan and what each person will bring", "Shared expectations prevent awkward spending pressure later.", ["That one person must secretly pay", "That no plan is needed", "That the most expensive option is best"]],
    ],
    principle: "Protect the real goal, change expensive methods and make the money limit visible before choosing.",
    limit: "Free activities still have limits such as opening times, access and travel safety. Check the practical details.",
  },
  {
    id: "gym-map-9", title: "Explain a Phone Contract Clearly", emoji: "📱", difficulty: 2, creativity: true,
    areas: ["work", "money"], frameworks: ["plain-language", "communication", "creative-problem-solving"],
    scenario: "You work in a phone shop. A customer does not understand '£20 per month, rising to £22 after six months, plus a £30 setup fee'. You must keep every price and condition accurate, but you can change the words and order.",
    problem: "Make a complicated offer easier to understand without hiding a cost.",
    prompt: "Rewrite one confusing price or condition you have seen so the total effect is clear to an ordinary customer.",
    steps: [
      ["Which explanation is clearest?", "You pay £30 today, then £20 a month for six months and £22 a month after that", "It puts each cost beside the time when the customer pays it.", ["The tariff has a stepped price journey", "It is only £20, apart from other charges", "Do not worry about the later price"]],
      ["Why must the later price be included?", "It changes what the customer will actually pay", "Leaving it out would make the offer sound cheaper than it is.", ["Longer explanations always sell more", "Every customer already knows it", "The setup fee replaces the monthly fee"]],
      ["How can you check the explanation?", "Ask the customer to describe the costs back in their own words", "Their explanation shows whether the important meaning was understood.", ["Ask only whether they like the phone colour", "Repeat the same phrase faster", "Remove the figures"]],
    ],
    principle: "Plain language keeps every important fact but puts it in the order and words the listener needs.",
    limit: "Simpler wording must not remove a cost, condition or risk. Accuracy and clarity have to work together.",
  },
  {
    id: "gym-map-10", title: "Improve a Shopping Bag for an Older Customer", emoji: "🛍️", difficulty: 2, creativity: true,
    areas: ["work", "home"], frameworks: ["user-centred-design", "observation", "creative-problem-solving"],
    scenario: "A supermarket customer says the thin bag handles hurt their hands and the bag tips over in the car. A new design must still fold flat, carry the same shopping and cost little to make.",
    problem: "Improve the bag for the person using it while keeping the practical limits.",
    prompt: "Choose an everyday object and suggest one change for a person who finds the current version difficult to use.",
    steps: [
      ["Which idea addresses both reported problems?", "Use wider soft handles and a flat reinforced base", "Wider handles spread pressure, while a flat base helps the bag stay upright.", ["Make the bag taller with the same thin handles", "Print larger adverts on it", "Remove the handles"]],
      ["What should be tested with customers?", "Comfort, stability, capacity and whether it still folds flat", "These checks cover the user's problems and every stated limit.", ["Only the bag colour", "Whether staff can guess the result", "Whether it looks unusual"]],
      ["Why involve people who have the problem?", "They can reveal difficulties the designer may not notice", "Designing with users gives evidence about real use rather than assumptions.", ["They must accept every first idea", "Designers are never allowed ideas", "One person represents every customer"]],
    ],
    principle: "Start with the difficulty a person actually experiences, generate changes and test them against both user needs and practical limits.",
    limit: "One design will not suit everyone. Testing with several people helps reveal different needs and new trade-offs.",
  },
];

for (const replacement of MTC_EVERYDAY_REPLACEMENTS) {
  const challenge = MTC_GYM_CHALLENGES.find((item) => item.id === replacement.id);
  if (!challenge) continue;
  const creative = Boolean(replacement.creativity);
  Object.assign(challenge, {
    format: "workout",
    title: replacement.title,
    scenario: replacement.scenario,
    difficulty: replacement.difficulty,
    emoji: replacement.emoji,
    frameworks: replacement.frameworks,
    lifeAreas: replacement.areas,
    hint: creative
      ? "Start with the limits. A useful new idea must still be safe, honest and possible."
      : "Everything you need is in the situation and the stated rule. Use those facts rather than job knowledge.",
    payload: {
      problem: replacement.problem,
      everydayReplacement: true,
      creativity: creative,
      creativePrompt: replacement.prompt || "",
      fairnessNote: creative
        ? "There may be other good ideas. Points come from choosing the option that best fits every limit shown."
        : "Use only the facts and rules shown here. You do not need experience in this job.",
      steps: replacement.steps.map(([ask, correct, because, wrong]) => ({
        ask,
        options: [correct, ...wrong],
        answer: 0,
        because,
      })),
    },
    debrief: {
      principle: replacement.principle,
      whereItMisleads: replacement.limit,
    },
  });
}

/* Final global-English pass.
 *
 * Keep familiar currencies and ordinary UK/US words, but pair terms when a
 * reader elsewhere may know only one version. Historical examples must carry
 * all of their own context, and no answer may depend on knowing a local law.
 */
function mtcGymChallenge(id) {
  return MTC_GYM_CHALLENGES.find((item) => item.id === id);
}

function mtcReplaceVisibleText(value, replacements, key = "") {
  const structural = new Set(["id", "format", "muscle", "frameworks", "lifeAreas", "emoji", "bucket", "value"]);
  if (typeof value === "string") {
    if (structural.has(key)) return value;
    return replacements.reduce((text, [pattern, next]) => text.replace(pattern, next), value);
  }
  if (Array.isArray(value)) return value.map((item) => mtcReplaceVisibleText(item, replacements, key));
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      value[childKey] = mtcReplaceVisibleText(childValue, replacements, childKey);
    }
  }
  return value;
}

const animationStudio = mtcGymChallenge("gym-map-3");
mtcReplaceVisibleText(animationStudio, [[/Pixar/g, "the animation studio"]]);
animationStudio.title = "How an Animation Studio Can Help a Clinic";
animationStudio.scenario = "A hospital clinic has long waits. A successful animation studio improves films through rough drafts and honest peer feedback. Use that clearly described process to help the clinic improve.";
animationStudio.hint = "Look for ways to test an idea cheaply, invite honest feedback and fix a weak process before blaming a person.";
animationStudio.payload.sourceDomain = "How an animation studio develops a film";
animationStudio.payload.pairs = [
  {
    prompt: "Colleagues give honest feedback, but they cannot order the creator to accept it",
    match: "Clinic workers review cases together and question decisions without threatening anyone's job",
  },
  {
    prompt: "Everyone expects the first draft to need work",
    match: "Try a new clinic layout for one afternoon before changing the whole clinic",
  },
  {
    prompt: "A cheap rough version of the whole film is tested before the finished version is made",
    match: "Walk an imaginary patient through the whole visit before rebuilding any one step",
  },
  {
    prompt: "When something goes wrong, improve the process instead of blaming one person",
    match: "When a patient leaves late, ask which step caused the delay instead of blaming the nurse on duty",
  },
  {
    prompt: "A promising new idea gets a short, protected trial before people judge it",
    match: "Test a new way of deciding who is seen first for a fixed period before cancelling it after one complaint",
  },
];
animationStudio.payload.misleads = {
  question: "Where could the animation studio example mislead a clinic?",
  options: [
    "A studio can discard a rough film. A clinic must keep caring for patients while it tests improvements",
    "The studio does not use feedback, so feedback has no place in the clinic",
    "A weak film costs money, but a weak clinic process can harm people. Tests must therefore be small and safe",
    "Clinics have no deadlines, so a rough trial cannot help",
  ],
  answers: [0, 2],
};
animationStudio.payload.fairnessNote = "You do not need to know the studio. Every part of its process is explained on the cards.";
animationStudio.debrief = {
  principle: "Good ideas improve through honest feedback, safe trials and attention to the process rather than blame.",
  whereItMisleads: "A clinic cannot risk patient safety to test an idea. Start with a small trial or a practice run that cannot harm anyone.",
};

const casinoFreelancer = mtcGymChallenge("gym-map-4");
casinoFreelancer.title = "What a Casino Can Teach a Freelancer";
casinoFreelancer.scenario = "A self-employed designer has very uneven income. A casino plans for many small games, keeps money in reserve and limits any one bet. Use those explained ideas to help her build a steadier income.";
casinoFreelancer.hint = "Look for four simple protections: earn something on average, repeat the work, keep savings and never depend too much on one customer.";
casinoFreelancer.payload.sourceDomain = "How a casino manages money across many small games";
casinoFreelancer.payload.targetDomain = "How a self-employed person manages uneven income";
casinoFreelancer.payload.pairs = [
  {
    prompt: "Each game earns the casino a small amount on average",
    match: "Price each project above its full cost, including unpaid planning and paperwork",
  },
  {
    prompt: "One win or loss proves little, so the casino looks at many games together",
    match: "Judge prices across a full year, not by whether one month was good or bad",
  },
  {
    prompt: "The casino keeps enough money to survive an unusually large payout",
    match: "Keep savings for quiet months or a customer who pays late",
  },
  {
    prompt: "The casino limits the size of any one bet",
    match: "Do not let one customer provide so much income that losing them ends the business",
  },
  {
    prompt: "The casino expects some losing nights and plans for them",
    match: "Expect some months to lose money and include them in the yearly plan",
  },
];
casinoFreelancer.payload.misleads = {
  question: "Where could the casino example mislead a self-employed person?",
  options: [
    "A casino handles far more games than one person can handle projects, so bad luck may last much longer for the designer",
    "A casino never keeps money in reserve, so savings do not fit the example",
    "A casino knows the chances in each game. A designer must estimate future costs and demand, and those estimates can be wrong",
    "A casino never loses a single game, unlike a designer",
  ],
  answers: [0, 2],
};
casinoFreelancer.payload.fairnessNote = "You do not need to know casino games. Each useful feature is explained before you match it.";
casinoFreelancer.debrief = {
  principle: "Uneven income is easier to manage when each job covers its costs, savings cover bad months and no single customer can end the business.",
  whereItMisleads: "A casino repeats the same game many times. A person's projects differ, so prices and future income remain estimates rather than known facts.",
};

const localShop = mtcGymChallenge("gym-map-7");
mtcReplaceVisibleText(localShop, [[/corner shop/gi, "small local shop"]]);
localShop.title = "The Small Local Shop's Opening Move";

const scarceResource = mtcGymChallenge("gym-map-11");
mtcReplaceVisibleText(scarceResource, [[/Badr/g, "the historical battle"], [/a licence or/g, "special permission or"]]);
scarceResource.title = "Control the Resource the Bigger Rival Needs";
scarceResource.scenario = "In a historical battle, a smaller side secured the only nearby wells before a much larger rival arrived. This gave it control of drinking water. Use that fact to help a small company choose where it can compete.";
scarceResource.hint = "Do not copy the bigger rival. Find one important thing it does not control, then build the plan around that advantage.";
scarceResource.payload.sourceDomain = "How a smaller side controlled a scarce resource";
scarceResource.payload.targetDomain = "How a small company can compete with a much larger one";
scarceResource.payload.pairs = [
  {
    prompt: "Avoid a direct contest that the larger side can win through size alone",
    match: "Stop trying to beat the larger company on lowest price or widest choice",
  },
  {
    prompt: "Identify one resource that could decide the contest",
    match: "Find something the rival cannot easily buy, such as direct customer access, special permission or community trust",
  },
  {
    prompt: "Secure the important resource before the larger side notices it",
    match: "Build that access, permission or trust while it is still affordable",
  },
  {
    prompt: "Control of the scarce resource makes size less important",
    match: "Offer something the larger company cannot match simply by spending more money",
  },
  {
    prompt: "Once the useful position is chosen, support it fully",
    match: "Focus the small team on its chosen advantage instead of weakly funding several different plans",
  },
];
scarceResource.payload.misleads = {
  question: "Where could the historical battle example mislead a small company?",
  options: [
    "A battle can end quickly, but business continues. An early advantage may later disappear",
    "A larger company can never copy or buy access to a useful resource",
    "Stories remember successful unusual choices. Similar choices may also fail when the chosen resource proves unimportant",
    "A small company always wins once it focuses on one advantage",
  ],
  answers: [0, 2],
};
scarceResource.payload.fairnessNote = "No history knowledge is needed. The only fact being used is that the smaller side controlled water the larger side needed.";
scarceResource.debrief = {
  principle: "A smaller group can avoid a contest based on size by finding and building around one important advantage the larger rival lacks.",
  whereItMisleads: "The company may choose the wrong advantage, or the rival may copy it later. The example suggests a move, not a guaranteed win.",
};

const roadHazard = mtcGymChallenge("gym-flaw-4");
roadHazard.scenario = "You are driving at 20 mph (about 32 km/h) past parked cars. A ball rolls into the road and you can see a child's shoes between two cars. The road behind you is clear.";
mtcReplaceVisibleText(roadHazard.payload, [[/the pavement/g, "the pavement or sidewalk"], [/20 mph/g, "20 mph (32 km/h)"]]);

const refundRequest = mtcGymChallenge("gym-flaw-9");
mtcReplaceVisibleText(refundRequest, [[/store credit/g, "store credit (shop credit)"]]);

const sweeterDrink = mtcGymChallenge("gym-chain-18");
Object.assign(sweeterDrink, {
  title: "The Sweeter Drink Customers Rejected",
  scenario: "A drinks company creates a sweeter version after people prefer one sip in a blind test. It then removes the original drink. Put the results in order.",
});
Object.assign(sweeterDrink.payload, {
  event: "A drinks company changes its famous drink after a large blind test shows people prefer one sip of the sweeter version.",
  steps: [
    "The sweeter version genuinely wins the one-sip test",
    "The company concludes that the sweeter version is therefore the better product",
    "The original is removed, so customers experience the change as losing a familiar product",
    "Customers protest because the original mattered to them for more than its taste",
    "The company brings the original back and the careful research is remembered as a failure",
  ],
  intruder: "Sales of the sweeter version rise steadily as every customer accepts the change",
  fairnessNote: "No brand knowledge is needed. The test, decision and possible results are all explained on the cards.",
});
sweeterDrink.debrief = {
  principle: "A fair study answers the question it asked. Preferring one sip is not the same as wanting a familiar product to disappear.",
  whereItMisleads: "The lesson is not that research is useless. The test must match the real decision people will face.",
};

const cardMachine = mtcGymChallenge("gym-workout-4");
mtcReplaceVisibleText(cardMachine, [
  [/cash machine/g, "cash machine (ATM)"],
  [/legal, clear, practical/g, "allowed, clear and practical"],
]);

const deliveryRoute = mtcGymChallenge("gym-workout-8");
mtcReplaceVisibleText(deliveryRoute, [
  [/public roads/g, "roads open to delivery vans"],
  [/legal routes/g, "routes allowed by the road signs"],
  [/legal route/g, "route allowed by the road signs"],
  [/legal-road limit/g, "road-sign limit"],
  [/Safety, legality/g, "Safety, road signs"],
  [/bus-only road/g, "road marked for buses only"],
]);

const officeForm = mtcGymChallenge("gym-workout-11");
mtcReplaceVisibleText(officeForm, [
  [/The legal questions/g, "The required questions"],
  [/the legal meaning/g, "the required meaning"],
]);

const cashTriage = mtcGymChallenge("gym-triage-8");
mtcReplaceVisibleText(cashTriage.payload, [[/breaks a legal or contract duty/g, "breaks a duty the business is already required to meet"]]);

const rentRise = mtcGymChallenge("gym-workout-19");
rentRise.hint = "Slow the decision down. Check the rental agreement, the written details and your budget before making a specific request.";
rentRise.payload.steps[0] = {
  ask: "What is the best first reply?",
  options: ["I have received the message. I need time to check my rental agreement and budget before I respond", "Fine, I agree", "You are greedy and I will report you", "Ignore every message"],
  answer: 0,
  because: "This confirms receipt without accepting the change and gives you time to check the facts.",
};
rentRise.payload.steps[1] = {
  ask: "What should you check next?",
  options: ["The rental agreement, the written details of the increase and your budget", "What rent strangers pay in another city", "Whether the landlord sounds confident", "How quickly you can borrow the difference"],
  answer: 0,
  because: "These facts show what was agreed, what is being proposed and whether you can afford it.",
};
rentRise.payload.steps[2] = {
  ask: "The increase would stretch your budget. What is a useful request?",
  options: ["Ask for the reason and propose a smaller increase or a later start date", "Threaten to damage the property", "Agree now and hope the cost becomes easier", "Stop paying rent without advice"],
  answer: 0,
  because: "A specific alternative gives both sides something clear to consider.",
};
rentRise.payload.steps[3] = {
  ask: "The rental agreement is unclear. What should you do?",
  options: ["Use an independent housing advice service before signing or withholding anything", "Rely on the landlord's explanation alone", "Ask social media to vote", "Move out tonight"],
  answer: 0,
  because: "Independent advice can help you understand the agreement before you make a risky decision.",
};
rentRise.debrief = {
  principle: "Do not make a housing decision under pressure. Check the written agreement, understand your budget and make a clear request.",
  whereItMisleads: "An agreement may be unclear or incomplete. Independent housing advice can help you understand it before you sign or withhold payment.",
};

const followedAfterCash = mtcGymChallenge("gym-workout-22");
followedAfterCash.title = "Someone Follows You After Using an ATM";
followedAfterCash.scenario = "After using a cash machine (ATM) at night, you notice the same person behind you through two turns. You are five minutes from home and your car is in a quiet side street.";

/* Everyday mental-model practice. Six abstract cards are replaced in place so
   saved progress and deep links keep working. Seven new cards fill genuine
   practice gaps found in the framework audit. */
const MTC_MENTAL_MODEL_REPLACEMENTS = [
  {
    id: "gym-chain-1", format: "chain", muscle: "adapt", difficulty: 1, xpBase: 50,
    title: "The Stock List Does Not Match the Shelves", emoji: "📋",
    scenario: "A café manager plans tomorrow's order from a stock list. Nobody updated the list during a busy weekend. Put the results in order.",
    frameworks: ["map-territory", "critical-thinking", "verification"],
    lifeAreas: ["work", "money"],
    hint: "The written list is only a picture of the stock. Follow what happens when the manager treats it as the real shelves.",
    payload: {
      event: "The manager orders supplies from the old stock list without checking the shelves.",
      steps: [
        "Several cartons of milk were used but never removed from the written count",
        "The manager assumes the written count still matches the shelves",
        "The order contains less milk than the café actually needs",
        "The café runs out during the next busy period",
        "Staff turn away drink orders, then count the real stock and correct the list",
      ],
      intruder: "The old stock list automatically changes to match every item used",
      mentalModelChallenge: true,
    },
    debrief: {
      principle: "A list, report or plan is only a simplified picture. Check it against reality before making a decision that depends on it.",
      whereItMisleads: "A recent, carefully maintained list may be reliable. The lesson is to check when the cost of being wrong matters.",
    },
  },
  {
    id: "gym-chain-2", format: "chain", muscle: "adapt", difficulty: 2, xpBase: 50,
    title: "Paid for Speed, Damages Go Up", emoji: "📦",
    scenario: "A packing team gets a bonus for parcels completed each hour. Damage and returns do not affect the bonus. Put the results in order.",
    frameworks: ["incentives", "systems-thinking", "second-order-thinking"],
    lifeAreas: ["work", "money"],
    hint: "Follow what the bonus measures. People can hit the number while harming the result the business actually wants.",
    payload: {
      event: "The business rewards only the number of parcels packed each hour.",
      steps: [
        "Workers learn that faster packing raises the bonus even when parcels are poorly protected",
        "Some workers shorten or skip checks that slow them down",
        "The number packed each hour rises",
        "More customers receive damaged goods and ask for replacements",
        "Replacement costs and complaints remove much of the apparent saving",
      ],
      intruder: "The speed-only bonus automatically rewards careful packing and fewer damaged goods",
      mentalModelChallenge: true,
    },
    debrief: {
      principle: "People respond to what is rewarded. A useful target must measure the real result, not one easy number that can be improved at its expense.",
      whereItMisleads: "Rewards are not always harmful. A balanced target could include speed, damage and customer complaints together.",
    },
  },
  {
    id: "gym-chain-15", format: "chain", muscle: "adapt", difficulty: 2, xpBase: 50,
    title: "Dinner for Four Becomes Dinner for Four Hundred", emoji: "🍲",
    scenario: "A cook who serves four people accepts an order for four hundred. They plan to multiply every ingredient by one hundred and change nothing else. Put the results in order.",
    frameworks: ["scale", "systems-thinking", "constraints"],
    lifeAreas: ["work", "home"],
    hint: "More food also needs more storage, equipment, time and people. Find the first part of the small process that cannot handle the new size.",
    payload: {
      event: "The cook uses the four-person process for four hundred people, only multiplying the ingredients.",
      steps: [
        "The ingredients no longer fit in the available fridge or preparation space",
        "The cooker cannot heat enough portions at the same time",
        "Finished dishes wait while later batches are still being cooked",
        "Much of the food reaches guests late or cold",
        "The cook realises the larger job needs batches, more equipment and a larger team",
      ],
      intruder: "Multiplying the ingredients also makes the fridge, cooker and team one hundred times larger",
      mentalModelChallenge: true,
    },
    debrief: {
      principle: "A process can change when it becomes much larger. Look for the first limit in space, equipment, time or coordination.",
      whereItMisleads: "Some tasks do scale by simple multiplication. Check the real limits instead of assuming every larger job needs a complete redesign.",
    },
  },
  {
    id: "gym-chain-16", format: "chain", muscle: "adapt", difficulty: 2, xpBase: 50,
    title: "One App Provides Nearly All the Work", emoji: "🚚",
    scenario: "A self-employed delivery driver gets 85% of their income from one app. They stop taking work from smaller customers because the app stays busy. Put the results in order.",
    frameworks: ["diversification", "risk-assessment", "margin-of-safety"],
    lifeAreas: ["work", "money"],
    hint: "The income looks steady while the app is available. Follow what happens when one source controls nearly everything.",
    payload: {
      event: "The driver depends on one app for 85% of their income and lets other customer relationships end.",
      steps: [
        "The app becomes the driver's only reliable source of daily work",
        "The driver's account is paused for a routine review",
        "Nearly all income stops immediately even though the driver is ready to work",
        "The smaller customers cannot quickly replace the missing work because those relationships ended",
        "The driver rebuilds several income sources so one pause cannot stop everything again",
      ],
      intruder: "The account pause automatically increases the income from every former customer",
      mentalModelChallenge: true,
    },
    debrief: {
      principle: "Do not let one source control everything important. Several income or supply sources make one failure easier to survive.",
      whereItMisleads: "Splitting attention across too many weak sources can reduce income. Diversify enough to survive, not so much that every source is neglected.",
    },
  },
  {
    id: "gym-chain-17", format: "chain", muscle: "adapt", difficulty: 2, xpBase: 50,
    title: "Three Complaints Change Every Drink", emoji: "☕",
    scenario: "A café serves four hundred drinks. Three people from one group say a new recipe is too sweet. The manager changes every drink the next day. Put the results in order.",
    frameworks: ["sampling", "scientific-thinking", "critical-thinking"],
    lifeAreas: ["work"],
    hint: "Three people from one group may share the same taste. They do not represent all four hundred customers.",
    payload: {
      event: "The manager treats three complaints from one group as the view of all customers.",
      steps: [
        "The manager does not ask a wider or randomly chosen group of customers",
        "The recipe is changed using only the three complaints",
        "Many regular customers receive a different drink without being asked",
        "More customers dislike the new version than disliked the first one",
        "The manager restores the recipe and tests future changes with a larger, mixed group",
      ],
      intruder: "A random group of customers is asked before any recipe is changed",
      mentalModelChallenge: true,
    },
    debrief: {
      principle: "A few examples can suggest a question, but they rarely prove a broad conclusion. Check the size and variety of the sample.",
      whereItMisleads: "A small sample can still reveal a serious safety problem. The response should match both the evidence and the possible harm.",
    },
  },
  {
    id: "gym-workout-7", format: "workout", muscle: "judge", difficulty: 1, xpBase: 50,
    title: "Was £900, Now £500", emoji: "📱",
    scenario: "A phone is marked 'Was £900, now £500'. Two trusted shops sell the same new phone for £470 and £480, with the same included cover and return terms.",
    frameworks: ["anchoring", "critical-thinking", "decision-making"],
    lifeAreas: ["money"],
    hint: "The crossed-out price can pull your judgment toward £900. Compare the offer with real alternatives instead.",
    payload: {
      problem: "Decide whether the sale label shows that £500 is a good price.",
      mentalModelChallenge: true,
      steps: [
        { ask: "Which number may anchor your judgment?", options: ["The claimed old price of £900", "The number of shops", "The phone's colour", "The day of the week"], answer: 0, because: "The first high price can make £500 feel cheap before you compare it with anything else." },
        { ask: "What is the most useful comparison?", options: ["Prices for the same phone with the same conditions", "The largest discount label", "A different phone from five years ago", "How excited the seller sounds"], answer: 0, because: "Like-for-like prices show what the same product costs elsewhere now." },
        { ask: "What do the comparisons show?", options: ["£500 is not the lowest available price", "£500 must be a bargain because £900 is higher", "Every shop charges exactly the same", "The original price proves the phone's quality"], answer: 0, because: "The same phone is available for £470 and £480 under the same conditions." },
        { ask: "What is the sound decision?", options: ["Judge the £500 offer against current alternatives, not the crossed-out price", "Buy immediately before comparing", "Assume the largest claimed saving is best", "Ignore the final amount paid"], answer: 0, because: "An independent comparison reduces the pull of the first number." },
    ]},
    debrief: {
      principle: "The first number you see can shape what feels cheap or expensive. Build your judgment from independent comparisons.",
      whereItMisleads: "The cheapest option is not always best. Compare condition, included service and reliability as well as price.",
    },
  },
];

for (const replacement of MTC_MENTAL_MODEL_REPLACEMENTS) {
  const challenge = mtcGymChallenge(replacement.id);
  Object.keys(challenge).forEach((key) => delete challenge[key]);
  Object.assign(challenge, replacement);
}

const MTC_MENTAL_MODEL_ADDITIONS = [
  {
    id: "gym-workout-25", format: "workout", muscle: "prioritise", difficulty: 1, xpBase: 50,
    title: "Leave Money for the Surprise Bill", emoji: "💷",
    scenario: "You receive £1,000. Regular bills cost £860 and travel until payday costs £60. A necessary household item may need an £80 replacement.",
    frameworks: ["margin-of-safety", "budgeting", "risk-assessment"], lifeAreas: ["money", "home"],
    hint: "Set aside known costs and the possible replacement before treating any money as spare.",
    payload: {
      problem: "Build a budget that can handle the stated surprise without borrowing.", mentalModelChallenge: true,
      steps: [
        { ask: "How much remains after regular bills?", options: ["£140", "£60", "£80", "£860"], answer: 0, because: "£1,000 minus £860 leaves £140." },
        { ask: "What else must the plan protect?", options: ["£60 travel and the possible £80 replacement", "Only optional shopping", "A more expensive phone", "Nothing because the bills are paid"], answer: 0, because: "Travel is known and the replacement is a stated risk. Together they use the remaining £140." },
        { ask: "Which choice keeps the buffer?", options: ["Set aside both amounts and delay optional spending", "Spend £100 now and hope", "Ignore travel costs", "Borrow before anything breaks"], answer: 0, because: "This leaves the money available for both the known journey costs and the possible replacement." },
        { ask: "Why keep the £80 before the item breaks?", options: ["A buffer protects the plan when a realistic surprise happens", "The replacement is certain today", "Unused money has no value", "Every surprise costs exactly £80"], answer: 0, because: "A safety buffer handles uncertainty. It does not claim to predict the exact event." },
    ]},
    debrief: { principle: "A plan needs spare room when one realistic surprise could force borrowing or stop something essential.", whereItMisleads: "Keeping the largest possible buffer can prevent useful spending forever. Match the buffer to the likely cost and seriousness of being wrong." },
  },
  {
    id: "gym-workout-26", format: "workout", muscle: "adapt", difficulty: 1, xpBase: 50,
    title: "Make Studying Easier to Start", emoji: "📚",
    scenario: "After work, you plan to study online. Your laptop is packed away, the lesson link is hard to find and your phone is beside you.",
    frameworks: ["activation-energy", "habit-building", "process-design"], lifeAreas: ["study", "work"],
    hint: "Do not demand more motivation first. Remove the small obstacles between finishing work and opening the lesson.",
    payload: {
      problem: "Reduce the effort needed to begin the useful habit.", mentalModelChallenge: true,
      steps: [
        { ask: "What makes starting harder here?", options: ["Several setup steps and an easy distraction", "The lesson already being open", "A clear first task", "The phone being in another room"], answer: 0, because: "Finding equipment and links adds effort, while the nearby phone offers an easier action." },
        { ask: "Which preparation removes friction?", options: ["Leave the laptop ready, save the lesson link and move the phone away", "Hide the charger", "Choose a new course each evening", "Wait to feel fully motivated"], answer: 0, because: "The useful action becomes the easiest visible next step." },
        { ask: "What is a helpful first target?", options: ["Open the lesson and study for five minutes", "Complete the whole course tonight", "Study only when energy feels perfect", "Buy more equipment first"], answer: 0, because: "A small start gets the task moving without requiring a large burst of effort." },
        { ask: "How should the change be judged?", options: ["Check whether starting became more consistent over several days", "Judge it after one tired evening", "Count how expensive the laptop is", "Assume preparation guarantees success"], answer: 0, because: "Repeated starts show whether the changed setup is helping." },
    ]},
    debrief: { principle: "The first step often needs the most effort. Arrange the environment so the useful action is easy to begin.", whereItMisleads: "Reducing friction helps you start, but it cannot replace rest, time or a reason to continue." },
  },
  {
    id: "gym-workout-27", format: "workout", muscle: "prioritise", difficulty: 1, xpBase: 50,
    title: "Stop Polishing the Finished Report", emoji: "📝",
    scenario: "Your weekly report is correct, clear and ready. You have one hour left. A customer problem also needs a reply today.",
    frameworks: ["diminishing-returns", "prioritisation", "decision-making"], lifeAreas: ["work"],
    hint: "Compare the value of another hour on work that is already good with an hour on a problem that is still open.",
    payload: {
      problem: "Put the remaining hour where it produces the most useful improvement.", mentalModelChallenge: true,
      steps: [
        { ask: "What would another hour change in the report?", options: ["Only small spacing and wording details", "Its figures from wrong to correct", "Its purpose completely", "The customer's unresolved problem"], answer: 0, because: "The scenario says the report is already correct, clear and ready." },
        { ask: "Where can the hour add more value?", options: ["Reply to the customer problem that still needs action", "Keep adjusting tiny spaces", "Change every heading colour", "Read the finished report ten more times"], answer: 0, because: "The open customer problem can improve meaningfully, while further report polishing adds little." },
        { ask: "What is a sensible stopping rule?", options: ["Stop when the report is correct, clear and meets its purpose", "Stop only when no word could ever change", "Never check the report", "Stop after a random number of minutes"], answer: 0, because: "A clear quality threshold prevents endless work without removing necessary checks." },
        { ask: "When should you keep improving instead?", options: ["When another check could still prevent an important error", "Whenever a task can be made one percent prettier", "When another task feels unfamiliar", "Only when someone is watching"], answer: 0, because: "Diminishing returns do not justify ignoring errors with serious consequences." },
    ]},
    debrief: { principle: "Once important quality is reached, extra effort may add less value than the same effort used on an unfinished problem.", whereItMisleads: "Do not use diminishing returns as an excuse for careless work. Define the required quality before deciding that enough is enough." },
  },
  {
    id: "gym-signal-23", format: "signal", muscle: "judge", difficulty: 1, xpBase: 50,
    title: "Everyone Else Is Buying This Course", emoji: "👥",
    scenario: "A course page says thirty-four people bought today and only eight places remain. Decide what supports its claim of being trustworthy and useful.",
    frameworks: ["social-proof", "critical-thinking", "source-checking"], lifeAreas: ["scams", "study", "money"],
    hint: "Popularity can be real, mistaken or invented. Look for facts that do not come from the seller's own crowd claims.",
    payload: {
      claim: "The course is trustworthy and useful because many other people appear to be buying it.", mentalModelChallenge: true,
      evidence: [
        { text: "The purchase counter is controlled by the seller and cannot be checked independently", bucket: "undermines" },
        { text: "Most reviews use the same vague wording and appeared on the same day", bucket: "undermines" },
        { text: "Several identifiable former students describe specific strengths and limits on independent websites", bucket: "supports" },
        { text: "The seller provides a full lesson sample that matches the advertised level", bucket: "supports" },
        { text: "The page gives clear course content, total cost and contact details that can be verified", bucket: "supports" },
        { text: "The buy button is bright orange", bucket: "irrelevant" },
        { text: "The presenter is standing beside an expensive car", bucket: "irrelevant" },
      ],
    },
    debrief: { principle: "A crowd is not proof. Check whether the people and results are real, independent and relevant to the decision.", whereItMisleads: "Popularity can provide useful information when choices are independent and genuine. It should support evidence, not replace it." },
  },
  {
    id: "gym-ask-12", format: "ask", muscle: "question", difficulty: 1, xpBase: 50,
    title: "Is Your Coworker Careless?", emoji: "🕒",
    scenario: "A coworker arrived twenty-five minutes late three times this month. You are about to decide that they do not care about the team.",
    frameworks: ["attribution-error", "questioning", "communication"], lifeAreas: ["work", "relationships"],
    hint: "Separate the behaviour you observed from your judgment about the person. Ask what situation or pattern could explain it.",
    payload: {
      situation: "You can ask three questions before speaking to them about the pattern.", budget: 3, mentalModelChallenge: true,
      questions: [
        { text: "What happened on the three late days?", value: "high", answer: "The first bus was repeatedly cancelled during temporary road works.", because: "This gives a situation that could explain the repeated timing without proving the person does not care." },
        { text: "Did they tell anyone they would be late?", value: "high", answer: "They messaged the manager each time, but the rest of the team was not told.", because: "This changes the judgment that they ignored the effect on others." },
        { text: "What happens on shifts that start later?", value: "high", answer: "They usually arrive ten minutes early.", because: "The wider pattern helps separate a transport problem from general unreliability." },
        { text: "What music do they listen to?", value: "low", answer: "They like several kinds of music.", because: "This does not explain the late arrivals or help solve them." },
        { text: "What did they eat for breakfast?", value: "low", answer: "They had toast.", because: "This is personal but not useful to the decision." },
        { text: "Do they like the colour of the staff room?", value: "low", answer: "They have no strong view.", because: "The answer cannot change how you understand or address the late arrivals." },
      ],
      decision: {
        ask: "What is the best next step?",
        options: ["Discuss the pattern and agree a temporary travel or start-time plan", "Tell everyone the coworker is lazy", "Ignore the effect on the team forever", "Punish them before hearing the facts"],
        answer: 0,
        because: "The facts show a repeated problem with a specific cause. A clear plan addresses it without inventing a character judgment.",
      },
    },
    debrief: { principle: "Observed behaviour is real, but your first explanation may not be. Check the situation and wider pattern before judging someone's character.", whereItMisleads: "A difficult situation does not remove responsibility. Once the cause is understood, the people involved still need a workable plan." },
  },
  {
    id: "gym-chain-19", format: "chain", muscle: "prioritise", difficulty: 1, xpBase: 50,
    title: "Plan the Morning Backwards", emoji: "⏰",
    scenario: "Training begins at 9:00. You need ten minutes to check in, ten minutes to park and walk, and fifty minutes for the journey. Add a ten-minute buffer.",
    frameworks: ["working-backward", "prioritisation", "margin-of-safety"], lifeAreas: ["work", "study", "safety"],
    hint: "Start from 9:00 and subtract each required step. The final card should make the planned departure possible.",
    payload: {
      event: "You work backward from being ready when training begins at 9:00.", mentalModelChallenge: true,
      steps: [
        "Plan to reach the check-in desk by 8:50",
        "Plan to park by 8:40 so there are ten minutes to walk",
        "Count back fifty minutes for the journey, giving 7:50",
        "Add a ten-minute buffer, making the target departure time 7:40",
        "Prepare the bag and directions the night before so a 7:40 departure is realistic",
      ],
      intruder: "Begin getting ready at 9:00 because that is when the training starts",
    },
    debrief: { principle: "A fixed finish becomes easier to plan when you work backward through every required step and include a realistic buffer.", whereItMisleads: "Times are estimates. Check current travel information and update the plan when conditions change." },
  },
  {
    id: "gym-workout-28", format: "workout", muscle: "judge", difficulty: 1, xpBase: 50,
    title: "The Dashboard Falls for One Day", emoji: "📉",
    scenario: "An online shop's dashboard shows a one-day sales fall just after its counting system changed. A manager wants to cut prices, change adverts and message every customer immediately.",
    frameworks: ["action-bias", "scientific-thinking", "decision-making"], lifeAreas: ["work", "money"],
    hint: "Visible action can feel reassuring. First check whether the fall is real and avoid changing several things at once.",
    payload: {
      problem: "Choose a response that learns before creating new problems.", mentalModelChallenge: true,
      steps: [
        { ask: "What should be checked first?", options: ["Whether the counting change created the apparent fall", "Which three major changes to launch together", "The manager's favourite advert", "How worried the graph looks"], answer: 0, because: "A changed counting method can move the dashboard even when customer behaviour did not change." },
        { ask: "What comparison would help next?", options: ["Reliable order records across several similar days", "One hour from the new dashboard", "A competitor's logo", "The colour of the sales line"], answer: 0, because: "A wider, trusted comparison helps separate a real pattern from one unusual or miscounted day." },
        { ask: "The fall is real. What is the safer test?", options: ["Change one relevant thing for a limited group and compare the result", "Change prices, adverts and messages together", "Make a permanent change immediately", "Hide the result"], answer: 0, because: "A small single change can show what helped without exposing the whole shop to an untested response." },
        { ask: "Why can immediate action be weaker?", options: ["Several rushed changes can cause harm and hide which one mattered", "Waiting is always correct", "Managers should never make changes", "Sales figures are never useful"], answer: 0, because: "Action is useful when it is informed. Pressure alone does not make a large response effective." },
    ]},
    debrief: { principle: "Pressure can make any action feel better than checking. Confirm the problem, then use the smallest test that can teach you something.", whereItMisleads: "Some dangers require immediate action. Stabilise urgent harm first, then investigate without making unnecessary changes." },
  },
];

MTC_GYM_CHALLENGES.push(...MTC_MENTAL_MODEL_ADDITIONS);

const sweeterDrinkModel = mtcGymChallenge("gym-chain-18");
sweeterDrinkModel.frameworks = ["design-thinking", "scientific-thinking", "loss-aversion"];

for (const challenge of MTC_GYM_CHALLENGES) {
  challenge.payload.globalClarityChecked = true;
  if (!challenge.payload.fairnessNote) {
    challenge.payload.fairnessNote = "Everything needed is on this card. No cultural knowledge or specialist training is being tested.";
  }
}
